import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchStudentPlatformRatings, RatingRecord, RatingPlatform } from "../../api/ratings/service";
import { queryKeys } from "../../constants/queryKeys";

interface StudentProgressCardProps {
  studentId: string;
}

type TimeRange = "1m" | "6m" | "1y" | "all";

const PLATFORMS: { key: RatingPlatform; label: string; color: string; gradientId: string }[] = [
  { key: "chesscom", label: "Chess.com", color: "#81b64c", gradientId: "colorChesscom" },
  { key: "lichess",  label: "Lichess",   color: "#e6e6e6", gradientId: "colorLichess" },
  { key: "fide",     label: "FIDE",      color: "#c4a35a", gradientId: "colorFide" },
];

// staleTime per platform — data updates weekly for chesscom/lichess, monthly for fide
const STALE_TIME: Record<RatingPlatform, number> = {
  chesscom: 6 * 60 * 60 * 1000,  // 6 hours (weekly cron)
  lichess:  6 * 60 * 60 * 1000,  // 6 hours (weekly cron)
  fide:    24 * 60 * 60 * 1000,  // 24 hours (monthly cron)
};

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "1m",  label: "1M" },
  { key: "6m",  label: "6M" },
  { key: "1y",  label: "1Y" },
  { key: "all", label: "All" },
];

function getTimeRangeCutoff(range: TimeRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  switch (range) {
    case "1m":  now.setMonth(now.getMonth() - 1); break;
    case "6m":  now.setMonth(now.getMonth() - 6); break;
    case "1y":  now.setFullYear(now.getFullYear() - 1); break;
  }
  return now;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-theme-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{formatTooltipDate(label)}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{payload[0].value}</p>
    </div>
  );
}

export default function StudentProgressCard({ studentId }: StudentProgressCardProps) {
  const [activePlatform, setActivePlatform] = useState<RatingPlatform>("chesscom");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const platformConfig = PLATFORMS.find((p) => p.key === activePlatform)!;

  // Each platform has its own independent query — cached per staleTime
  const chesscomQuery = useQuery<RatingRecord[]>({
    queryKey: queryKeys.ratings.byPlatform(studentId, "chesscom"),
    queryFn: () => fetchStudentPlatformRatings(studentId, "chesscom"),
    enabled: !!studentId,
    staleTime: STALE_TIME.chesscom,
  });

  const lichessQuery = useQuery<RatingRecord[]>({
    queryKey: queryKeys.ratings.byPlatform(studentId, "lichess"),
    queryFn: () => fetchStudentPlatformRatings(studentId, "lichess"),
    enabled: !!studentId,
    staleTime: STALE_TIME.lichess,
  });

  const fideQuery = useQuery<RatingRecord[]>({
    queryKey: queryKeys.ratings.byPlatform(studentId, "fide"),
    queryFn: () => fetchStudentPlatformRatings(studentId, "fide"),
    enabled: !!studentId,
    staleTime: STALE_TIME.fide,
  });

  const queryMap: Record<RatingPlatform, typeof chesscomQuery> = {
    chesscom: chesscomQuery,
    lichess: lichessQuery,
    fide: fideQuery,
  };

  const activeQuery = queryMap[activePlatform];
  const records = activeQuery.data ?? [];
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  // Filter by time range and transform for chart
  const chartData = useMemo(() => {
    const cutoff = getTimeRangeCutoff(timeRange);
    const filtered = cutoff
      ? records.filter((r) => new Date(r.recorded_at) >= cutoff)
      : records;

    return filtered.map((r) => ({
      date: r.recorded_at,
      dateFormatted: formatDate(r.recorded_at),
      rating: r.rating,
    }));
  }, [records, timeRange]);

  // Stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const ratings = chartData.map((d) => d.rating);
    const current = ratings[ratings.length - 1];
    const first = ratings[0];
    const change = current - first;
    const high = Math.max(...ratings);
    const low = Math.min(...ratings);
    return { current, change, high, low };
  }, [chartData]);

  // Dynamic Y-axis domain with padding
  const yDomain = useMemo((): [number, number] => {
    if (chartData.length === 0) return [0, 3000];
    const ratings = chartData.map((d) => d.rating);
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);
    const padding = Math.max(Math.round((max - min) * 0.15), 20);
    return [Math.max(0, min - padding), max + padding];
  }, [chartData]);

  const strokeColor = activePlatform === "lichess" ? "#b0b0b0" : platformConfig.color;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Rating Progress
        </h4>
      </div>

      {/* Platform tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            id={`progress-tab-${p.key}`}
            onClick={() => { setActivePlatform(p.key); setTimeRange("all"); }}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activePlatform === p.key
                ? "text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            style={activePlatform === p.key ? { backgroundColor: p.key === "lichess" ? "#555" : p.color } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Time range selector */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 w-fit">
        {TIME_RANGES.map((tr) => (
          <button
            key={tr.key}
            id={`progress-range-${tr.key}`}
            onClick={() => setTimeRange(tr.key)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              timeRange === tr.key
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tr.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-6 w-6 rounded-full border-3 border-brand-500 border-t-transparent" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Failed to load rating data</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && chartData.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No rating data available for {platformConfig.label}
          </p>
          <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">
            Ratings will appear after the next scrape cycle
          </p>
        </div>
      )}

      {/* Stats bar + Chart */}
      {!isLoading && !isError && chartData.length > 0 && stats && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Current</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">{stats.current}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Change</p>
              <p className={`text-xl font-bold ${
                stats.change > 0 ? "text-success-500" : stats.change < 0 ? "text-error-500" : "text-gray-800 dark:text-white/90"
              }`}>
                {stats.change > 0 ? "+" : ""}{stats.change}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Peak</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">{stats.high}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Low</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">{stats.low}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id={platformConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-gray-200, #E4E7EC)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: "var(--color-gray-500, #667085)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 11, fill: "var(--color-gray-500, #667085)" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rating"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill={`url(#${platformConfig.gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: strokeColor,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
