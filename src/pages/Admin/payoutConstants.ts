import { TransactionType, TransactionStatus } from "../../api/payouts/dto";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const TYPE_LABELS: Record<string, string> = {
  [TransactionType.PAYMENT]: "Payment",
  [TransactionType.CLASS_DEDUCTION]: "Monthly Classes",
  [TransactionType.REFERRAL_BONUS]: "Referral Bonus",
  [TransactionType.ADMIN_CREDIT]: "Admin Credit",
  [TransactionType.ADMIN_DEBIT]: "Admin Debit",
};

export const TYPE_COLORS: Record<string, "primary" | "warning" | "success" | "info" | "error"> = {
  [TransactionType.PAYMENT]: "success",
  [TransactionType.CLASS_DEDUCTION]: "warning",
  [TransactionType.REFERRAL_BONUS]: "info",
  [TransactionType.ADMIN_CREDIT]: "primary",
  [TransactionType.ADMIN_DEBIT]: "error",
};

export const STATUS_COLORS: Record<string, "success" | "warning" | "error"> = {
  [TransactionStatus.APPROVED]: "success",
  [TransactionStatus.PENDING]: "warning",
  [TransactionStatus.REJECTED]: "error",
};

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatBalance(balance: number): string {
  if (balance === 0) return "0";
  const sign = balance > 0 ? "+" : "";
  return `${sign}${Number.isInteger(balance) ? balance : balance.toFixed(2)}`;
}
