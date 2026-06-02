import { TimeRange } from "./progressConstants";

export interface ChartDataPoint {
  date: string;
  dateFormatted: string;
  rating: number;
}

export interface RatingStats {
  current: number;
  change: number;
  high: number;
  low: number;
}

export function getTimeRangeCutoff(range: TimeRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  switch (range) {
    case "1m":  now.setMonth(now.getMonth() - 1); break;
    case "6m":  now.setMonth(now.getMonth() - 6); break;
    case "1y":  now.setFullYear(now.getFullYear() - 1); break;
  }
  return now;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function computeStats(chartData: ChartDataPoint[]): RatingStats | null {
  if (chartData.length === 0) return null;
  const ratings = chartData.map((d) => d.rating);
  const current = ratings[ratings.length - 1];
  const first = ratings[0];
  const change = current - first;
  const high = Math.max(...ratings);
  const low = Math.min(...ratings);
  return { current, change, high, low };
}

export function computeYDomain(chartData: ChartDataPoint[]): [number, number] {
  if (chartData.length === 0) return [0, 3000];
  const ratings = chartData.map((d) => d.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const padding = Math.max(Math.round((max - min) * 0.15), 20);
  return [Math.max(0, min - padding), max + padding];
}
