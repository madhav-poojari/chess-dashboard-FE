import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { PlatformConfig } from "./progressConstants";
import { ChartDataPoint, formatDate, formatTooltipDate } from "./progressUtils";

interface RatingAreaChartProps {
  chartData: ChartDataPoint[];
  yDomain: [number, number];
  platformConfig: PlatformConfig;
  strokeColor: string;
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

export default function RatingAreaChart({ chartData, yDomain, platformConfig, strokeColor }: RatingAreaChartProps) {
  const currentRating = chartData.length > 0 ? chartData[chartData.length - 1].rating : null;
  return (
    <div className="h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={platformConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.05} />
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
          {currentRating !== null && (
            <ReferenceLine
              y={currentRating}
              stroke={strokeColor}
              strokeDasharray="4 4"
              strokeOpacity={0.45}
              strokeWidth={1}
            />
          )}
          <Area
            type="linear"
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
  );
}
