import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../constants/queryKeys";
import {
  fetchPendingTransactions,
  approveTransaction,
  rejectTransaction,
  fetchStudentBalances,
  adminAdjustUnits,
  fetchStudentTimeline,
  triggerDeduction,
} from "../api/payouts/service";
import { AdminAdjustPayload } from "../api/payouts/dto";
import { useToast } from "../context/ToastContext";

// ── Queries ──────────────────────────────────────────────

export function usePendingTransactions() {
  return useQuery({
    queryKey: queryKeys.payouts.pending(),
    queryFn: fetchPendingTransactions,
  });
}

export function useStudentBalances() {
  return useQuery({
    queryKey: queryKeys.payouts.balances(),
    queryFn: fetchStudentBalances,
  });
}

export function useStudentTimeline(userId: string) {
  return useQuery({
    queryKey: queryKeys.payouts.timeline(userId),
    queryFn: () => fetchStudentTimeline(userId),
    enabled: !!userId,
  });
}

// ── Mutations ────────────────────────────────────────────

export function useApproveTransaction() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (vars: { id: number; units?: number; reason?: string }) =>
      approveTransaction(vars.id, { units: vars.units, reason: vars.reason }),
    onSuccess: async () => {
      toast.success("Transaction approved");
      await queryClient.invalidateQueries({ queryKey: queryKeys.payouts.pending() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.payouts.balances() });
      // Also invalidate all timeline queries so the modal refreshes
      await queryClient.invalidateQueries({ queryKey: ["payouts", "timeline"] });
    },
    onError: () => {
      toast.error("Failed to approve transaction");
    },
  });
}

export function useRejectTransaction() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => rejectTransaction(id),
    onSuccess: async () => {
      toast.success("Transaction rejected");
      await queryClient.invalidateQueries({ queryKey: queryKeys.payouts.pending() });
      // Also invalidate all timeline queries so the modal refreshes
      await queryClient.invalidateQueries({ queryKey: ["payouts", "timeline"] });
    },
    onError: () => {
      toast.error("Failed to reject transaction");
    },
  });
}

export function useAdminAdjust() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: AdminAdjustPayload) => adminAdjustUnits(payload),
    onSuccess: async (_data, variables) => {
      toast.success("Units adjusted successfully");
      await queryClient.invalidateQueries({ queryKey: queryKeys.payouts.balances() });
      // Invalidate the specific student's timeline so the modal refreshes
      await queryClient.invalidateQueries({
        queryKey: queryKeys.payouts.timeline(variables.user_id),
      });
    },
    onError: () => {
      toast.error("Failed to adjust units");
    },
  });
}

export function useTriggerDeduction() {
  const toast = useToast();

  return useMutation({
    mutationFn: () => triggerDeduction(),
    onSuccess: () => {
      toast.success("Monthly deduction triggered");
    },
    onError: () => {
      toast.error("Failed to trigger deduction");
    },
  });
}
