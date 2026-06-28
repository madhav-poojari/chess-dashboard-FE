import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../constants/queryKeys";
import {
  fetchPendingTransactions,
  approveTransaction,
  rejectTransaction,
  fetchStudentBalances,
  adminAdjustUnits,
  fetchStudentTimeline,
  submitPaymentRequest,
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
    onSuccess: async () => {
      toast.success("Units adjusted successfully");
      await queryClient.invalidateQueries({ queryKey: queryKeys.payouts.balances() });
    },
    onError: () => {
      toast.error("Failed to adjust units");
    },
  });
}

export function useSubmitPayment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (vars: {
      file: File | null;
      transactionId: string;
      units?: number;
      reason?: string;
    }) => submitPaymentRequest(vars.file, vars.transactionId, vars.units, vars.reason),
    onSuccess: async () => {
      toast.success("Payment request submitted");
      await queryClient.invalidateQueries({ queryKey: queryKeys.payouts.pending() });
    },
    onError: () => {
      toast.error("Failed to submit payment request");
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
