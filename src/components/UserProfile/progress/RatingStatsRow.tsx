import { RatingStats } from "./progressUtils";

interface RatingStatsRowProps {
  stats: RatingStats;
}

export default function RatingStatsRow({ stats }: RatingStatsRowProps) {
  return (
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
  );
}
