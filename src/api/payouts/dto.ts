// Payout / Unit tracking DTOs

export enum TransactionType {
  PAYMENT = "payment",
  CLASS_DEDUCTION = "class_deduction",
  REFERRAL_BONUS = "referral_bonus",
  ADMIN_CREDIT = "admin_credit",
  ADMIN_DEBIT = "admin_debit",
}

export enum TransactionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface UnitTransaction {
  id: number;
  user_id: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  type: TransactionType;
  units: number;
  reason: string;
  screenshot_url: string;
  transaction_id: string;
  status: TransactionStatus;
  approved_by: string;
  approved_at: string | null;
  period_year: number;
  period_month: number;
  created_by: string;
  created_at: string;
}

export interface StudentWithBalance {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  balance: number;
}

export interface TimelineResponse {
  balance: number;
  transactions: UnitTransaction[];
}

export interface AdminAdjustPayload {
  user_id: string;
  units: number;
  reason: string;
  type: TransactionType;
  screenshot?: File | null;
}
