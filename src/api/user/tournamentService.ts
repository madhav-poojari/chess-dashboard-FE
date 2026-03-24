// src/api/user/tournamentService.ts
import api from "../axiosInstance";
import { ApiResponse } from "./dto";

export interface Tournament {
  id: number;
  title: string;
  url_path: string;
  city: string;
  state: string;
  dates: string;
  start_date: string | null;
  organizer: string;
  description: string;
  created_at: string;
}

export interface TournamentGroup {
  distance: number;
  tournaments: Tournament[];
}

export const fetchTournamentsByUserId = async (
  userId: string
): Promise<TournamentGroup[]> => {
  const res = await api.get(`/users/${userId}/tournaments`);
  const data: ApiResponse<TournamentGroup[]> = res.data;
  return data.data || [];
};
