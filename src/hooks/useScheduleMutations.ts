import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../context/ToastContext";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  CreateSchedulePayload,
} from "../api/schedule/service";
import { queryKeys } from "../constants/queryKeys";

// Extract the human-readable error message from an axios error response.
function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return (
    axiosErr.response?.data?.message ||
    axiosErr.response?.data?.error ||
    axiosErr.message ||
    fallback
  );
}

/**
 * Shared hook for schedule CRUD mutations with toast feedback
 * and automatic query invalidation.
 */
export function useScheduleMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all() });
  }, [queryClient]);

  const createMut = useMutation({
    mutationFn: (p: CreateSchedulePayload) => createSchedule(p),
    onSuccess: () => {
      invalidate();
      toast.success("Schedule slot added successfully");
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to add schedule slot"));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { day_of_week?: number; start_time?: string; timezone?: string };
    }) => updateSchedule(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Schedule slot updated successfully");
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to update schedule slot"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteSchedule(id),
    onSuccess: () => {
      invalidate();
      toast.success("Schedule slot deleted");
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to delete schedule slot"));
    },
  });

  return { createMut, updateMut, deleteMut };
}
