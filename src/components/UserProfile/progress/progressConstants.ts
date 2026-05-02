import { RatingPlatform } from "../../../api/ratings/service";

export type TimeRange = "1m" | "6m" | "1y" | "all";

export interface PlatformConfig {
  key: RatingPlatform;
  label: string;
  color: string;
  gradientId: string;
}

export const PLATFORMS: PlatformConfig[] = [
  { key: "chesscom", label: "Chess.com", color: "#81b64c", gradientId: "colorChesscom" },
  { key: "lichess",  label: "Lichess",   color: "#e6e6e6", gradientId: "colorLichess" },
  { key: "fide",     label: "FIDE",      color: "#c4a35a", gradientId: "colorFide" },
  { key: "uscf",     label: "USCF",      color: "#1a4d8f", gradientId: "colorUscf" },
];

// staleTime per platform — data updates weekly for chesscom/lichess, monthly for fide
export const STALE_TIME: Record<RatingPlatform, number> = {
  chesscom: 6 * 60 * 60 * 1000,  // 6 hours (weekly cron)
  lichess:  6 * 60 * 60 * 1000,  // 6 hours (weekly cron)
  fide:    24 * 60 * 60 * 1000,  // 24 hours (monthly cron)
  uscf:    24 * 60 * 60 * 1000,  // 24 hours (monthly manual scrape)
};

export const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "1m",  label: "1M" },
  { key: "6m",  label: "6M" },
  { key: "1y",  label: "1Y" },
  { key: "all", label: "All" },
];
