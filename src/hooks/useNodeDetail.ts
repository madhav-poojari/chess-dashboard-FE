import { useQuery } from "@tanstack/react-query";
import { fetchNodeDetail } from "../api/admin/referralGraphService";
import { NodeDetail } from "../api/admin/referralGraph.dto";

interface UseNodeDetailOptions {
  enabled?: boolean;
}

interface UseNodeDetailReturn {
  data: NodeDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useNodeDetail = (
  userId: string | undefined | null,
  options?: UseNodeDetailOptions
): UseNodeDetailReturn => {
  const { enabled = !!userId } = options || {};

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["nodeDetail", userId],
    queryFn: () => {
      if (!userId) throw new Error("User ID is required");
      return fetchNodeDetail(userId);
    },
    enabled,
    staleTime: 3 * 60 * 1000,
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
