import { useState } from "react";
import { usePendingTransactions, useApproveTransaction, useRejectTransaction } from "../../hooks/usePayouts";
import { TransactionType, UnitTransaction } from "../../api/payouts/dto";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { getImageUrl } from "../../utils/imageUrl";

const TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.PAYMENT]: "Payment",
  [TransactionType.CLASS_DEDUCTION]: "Class Deduction",
  [TransactionType.REFERRAL_BONUS]: "Referral Bonus",
  [TransactionType.ADMIN_CREDIT]: "Admin Credit",
  [TransactionType.ADMIN_DEBIT]: "Admin Debit",
};

const TYPE_COLORS: Record<TransactionType, "primary" | "warning" | "success" | "info" | "error"> = {
  [TransactionType.PAYMENT]: "success",
  [TransactionType.CLASS_DEDUCTION]: "warning",
  [TransactionType.REFERRAL_BONUS]: "info",
  [TransactionType.ADMIN_CREDIT]: "primary",
  [TransactionType.ADMIN_DEBIT]: "error",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBreakdown(details: Record<string, number> | null): string {
  if (!details) return "";
  return Object.entries(details)
    .map(([classType, count]) => `${count} ${classType.replace(/_/g, " ")}`)
    .join(", ");
}

export default function PayoutApprovalCard() {
  const { data: pending = [], isLoading } = usePendingTransactions();
  const approveMutation = useApproveTransaction();
  const rejectMutation = useRejectTransaction();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderRow = (tx: UnitTransaction) => {
    const isDeduction = tx.type === TransactionType.CLASS_DEDUCTION;
    const isExpanded = expandedRows.has(tx.id);
    const studentName = tx.user
      ? `${tx.user.first_name} ${tx.user.last_name}`
      : tx.user_id;

    return (
      <TableRow key={tx.id}>
        <TableCell className="px-5 py-4 text-start">
          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {studentName}
          </div>
          <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-0.5">
            {tx.user_id}
          </div>
        </TableCell>
        <TableCell className="px-5 py-4 text-center">
          <Badge size="sm" color={TYPE_COLORS[tx.type as TransactionType] || "light"}>
            {TYPE_LABELS[tx.type as TransactionType] || tx.type}
          </Badge>
        </TableCell>
        <TableCell className="px-5 py-4 text-center">
          <span
            className={`font-medium text-theme-sm ${
              tx.units > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {tx.units > 0 ? `+${tx.units}` : tx.units}
          </span>
        </TableCell>
        <TableCell className="px-5 py-4 text-start max-w-[200px]">
          <div className="text-gray-700 text-theme-sm dark:text-gray-300 truncate">
            {tx.reason || "—"}
          </div>
          {isDeduction && tx.details && (
            <button
              onClick={() => toggleExpand(tx.id)}
              className="text-brand-500 text-theme-xs mt-1 hover:underline"
            >
              {isExpanded ? "Hide breakdown" : "Show breakdown"}
            </button>
          )}
          {isDeduction && isExpanded && tx.details && (
            <div className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              {formatBreakdown(tx.details)}
            </div>
          )}
        </TableCell>
        <TableCell className="px-5 py-4 text-center">
          {tx.screenshot_url ? (
            <a
              href={getImageUrl(tx.screenshot_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline text-theme-xs"
            >
              View
            </a>
          ) : (
            <span className="text-gray-400 text-theme-xs">—</span>
          )}
        </TableCell>
        <TableCell className="px-5 py-4 text-center">
          <span className="text-gray-500 text-theme-xs dark:text-gray-400">
            {tx.transaction_id || "—"}
          </span>
        </TableCell>
        <TableCell className="px-5 py-4 text-center">
          <span className="text-gray-500 text-theme-xs dark:text-gray-400">
            {formatDate(tx.created_at)}
          </span>
        </TableCell>
        <TableCell className="px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={() => approveMutation.mutate(tx.id)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => rejectMutation.mutate(tx.id)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
          Pending Approval Requests
        </h3>
        {pending.length > 0 && (
          <span className="px-2.5 py-0.5 text-xs rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium">
            {pending.length}
          </span>
        )}
      </div>
      <div className="max-w-full overflow-x-auto">
        {isLoading ? (
          <div className="px-5 py-8 text-center text-gray-500 text-theme-sm">
            Loading...
          </div>
        ) : pending.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500 text-theme-sm">
            No pending approvals
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Student
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Type
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Units
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Reason
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Screenshot
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Txn ID
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Date
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {pending.map(renderRow)}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
