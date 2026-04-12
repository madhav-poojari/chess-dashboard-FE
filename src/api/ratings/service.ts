import api from "../axiosInstance";
import { ApiResponse } from "../user/dto";

export interface RatingRecord {
  id: number;
  user_id: string;
  platform: string;    // "chesscom" | "lichess" | "fide" | "uscf"
  rating_type: string; // "rapid" | "classical"
  rating: number;
  recorded_at: string; // ISO date string
  created_at: string;
}

export type RatingPlatform = "chesscom" | "lichess" | "fide";

export const fetchStudentPlatformRatings = async (
  studentId: string,
  platform: RatingPlatform
): Promise<RatingRecord[]> => {
  const res = await api.get(`/ratings/${studentId}/${platform}`);
  const data: ApiResponse<RatingRecord[]> = res.data;
  return data.data ?? [];
};
