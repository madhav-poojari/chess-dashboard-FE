import { useQuery } from "@tanstack/react-query";
import { fetchReferralGraph } from "../api/admin/referralGraphService";
import { GraphData } from "../api/admin/referralGraph.dto";

interface UseReferralGraphOptions {
  state?: string;
  enabled?: boolean;
}

interface UseReferralGraphReturn {
  data: GraphData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useReferralGraph = (options?: UseReferralGraphOptions): UseReferralGraphReturn => {
  const { state, enabled = true } = options || {};

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["referralGraph", state],
    queryFn: () => fetchReferralGraph(state),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch: () => refetch(),
  };
};
