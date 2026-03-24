// src/hooks/useTournaments.ts
import { useQuery } from "@tanstack/react-query";
import {
  fetchTournamentsByUserId,
  TournamentGroup,
} from "../api/user/tournamentService";
import { queryKeys } from "../constants/queryKeys";

export function useTournaments(userId: string) {
  return useQuery<TournamentGroup[]>({
    queryKey: queryKeys.tournaments.byUser(userId),
    queryFn: () => fetchTournamentsByUserId(userId),
    enabled: !!userId,
  });
}
