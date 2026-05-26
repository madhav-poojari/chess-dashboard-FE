import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStudentPlatformRatings, RatingRecord, RatingPlatform } from "../../api/ratings/service";
import { queryKeys } from "../../constants/queryKeys";
import { PLATFORMS, STALE_TIME, TIME_RANGES, TimeRange } from "./progress/progressConstants";
import { getTimeRangeCutoff, formatDate, computeStats, computeYDomain } from "./progress/progressUtils";
import RatingStatsRow from "./progress/RatingStatsRow";
import RatingAreaChart from "./progress/RatingAreaChart";

interface StudentProgressCardProps {
  studentId: string;
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

  const uscfQuery = useQuery<RatingRecord[]>({
    queryKey: queryKeys.ratings.byPlatform(studentId, "uscf"),
    queryFn: () => fetchStudentPlatformRatings(studentId, "uscf"),
    enabled: !!studentId,
    staleTime: STALE_TIME.uscf,
  });

  const queryMap: Record<RatingPlatform, typeof chesscomQuery> = {
    chesscom: chesscomQuery,
    lichess: lichessQuery,
    fide: fideQuery,
    uscf: uscfQuery,
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

  const stats = useMemo(() => computeStats(chartData), [chartData]);
  const yDomain = useMemo(() => computeYDomain(chartData), [chartData]);
  const strokeColor = activePlatform === "lichess" ? "#b0b0b0" : platformConfig.color;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Rating Progress
        </h4>
      </div>

      {/* Platform tabs + time format */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {platformConfig.timeFormat}
        </span>
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

      {/* Stats + Chart */}
      {!isLoading && !isError && chartData.length > 0 && stats && (
        <>
          <RatingStatsRow stats={stats} />
          <RatingAreaChart
            chartData={chartData}
            yDomain={yDomain}
            platformConfig={platformConfig}
            strokeColor={strokeColor}
          />
        </>
      )}
    </div>
  );
}
