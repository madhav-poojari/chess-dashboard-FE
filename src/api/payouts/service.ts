import api from "../axiosInstance";
import { ApiResponse } from "../user/dto";
import {
  AdminAdjustPayload,
  StudentWithBalance,
  TimelineResponse,
  UnitTransaction,
} from "./dto";

// ── Admin endpoints ──────────────────────────────────────

export const fetchPendingTransactions = async (): Promise<UnitTransaction[]> => {
  const res = await api.get("/payouts/pending");
  const data: ApiResponse<UnitTransaction[]> = res.data;
  return data.data;
};

export const approveTransaction = async (
  id: number,
  overrides?: { units?: number; reason?: string }
): Promise<void> => {
  await api.post(`/payouts/approve/${id}`, overrides || {});
};

export const rejectTransaction = async (id: number): Promise<void> => {
  await api.post(`/payouts/reject/${id}`);
};

export const fetchStudentBalances = async (): Promise<StudentWithBalance[]> => {
  const res = await api.get("/payouts/balances");
  const data: ApiResponse<StudentWithBalance[]> = res.data;
  return data.data;
};

export const adminAdjustUnits = async (
  payload: AdminAdjustPayload
): Promise<UnitTransaction> => {
  const res = await api.post("/payouts/adjust", payload);
  const data: ApiResponse<UnitTransaction> = res.data;
  return data.data;
};

export const fetchStudentTimeline = async (
  userId: string
): Promise<TimelineResponse> => {
  const res = await api.get(`/payouts/timeline/${userId}`);
  const data: ApiResponse<TimelineResponse> = res.data;
  return data.data;
};

export const triggerDeduction = async (): Promise<void> => {
  await api.post("/payouts/trigger-deduction");
};

// ── Student endpoint ─────────────────────────────────────

export const submitPaymentRequest = async (
  file: File | null,
  transactionId: string,
  units?: number,
  reason?: string
): Promise<{ id: number; screenshot_url: string }> => {
  const formData = new FormData();
  if (file) {
    formData.append("screenshot", file);
  }
  formData.append("transaction_id", transactionId);
  if (units && units > 0) {
    formData.append("units", String(units));
  }
  if (reason) {
    formData.append("reason", reason);
  }

  const res = await api.post("/payouts/payment-request", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const data: ApiResponse<{ id: number; screenshot_url: string }> = res.data;
  return data.data;
};
