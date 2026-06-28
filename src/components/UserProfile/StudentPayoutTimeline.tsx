import { useMemo } from "react";
import { useStudentTimeline } from "../../hooks/usePayouts";
import { TransactionType, TransactionStatus, UnitTransaction } from "../../api/payouts/dto";
import Badge from "../ui/badge/Badge";
import { useToast } from "../../context/ToastContext";

interface StudentPayoutTimelineProps {
  studentId: string;
  studentName?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TYPE_LABELS: Record<string, string> = {
  [TransactionType.PAYMENT]: "Payment",
  [TransactionType.CLASS_DEDUCTION]: "Monthly Classes",
  [TransactionType.REFERRAL_BONUS]: "Referral Bonus",
  [TransactionType.ADMIN_CREDIT]: "Admin Credit",
  [TransactionType.ADMIN_DEBIT]: "Admin Debit",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "error"> = {
  [TransactionStatus.APPROVED]: "success",
  [TransactionStatus.PENDING]: "warning",
  [TransactionStatus.REJECTED]: "error",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Group transactions by month-year */
function groupByMonth(txs: UnitTransaction[]): { label: string; year: number; month: number; items: UnitTransaction[] }[] {
  const groups: Record<string, UnitTransaction[]> = {};
  const order: string[] = [];

  for (const tx of txs) {
    const d = new Date(tx.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(tx);
  }

  return order.map((key) => {
    const [y, m] = key.split("-").map(Number);
    return {
      label: `${MONTH_NAMES[m]} ${y}`,
      year: y,
      month: m,
      items: groups[key],
    };
  });
}

/** Build a shareable text for the last 2 months */
function buildShareText(
  studentName: string,
  balance: number,
  groups: { label: string; items: UnitTransaction[] }[]
): string {
  const twoMonths = groups.slice(0, 2);
  if (twoMonths.length === 0) return "No transactions to share.";

  const periodLabels = twoMonths.map((g) => g.label);
  const period =
    periodLabels.length === 2
      ? `${periodLabels[1]} – ${periodLabels[0]}`
      : periodLabels[0];

  let text = `BRS Chess Academy — Unit Statement\n`;
  text += `Student: ${studentName}\n`;
  text += `Period: ${period}\n`;

  for (const group of [...twoMonths].reverse()) {
    text += `\n${group.label}:\n`;
    for (const tx of group.items) {
      const sign = tx.units > 0 ? "+" : "";
      const typeLabel = TYPE_LABELS[tx.type] || tx.type;
      let line = `  ${sign}${tx.units} units — ${typeLabel} (${tx.reason})`;
      if (tx.status === TransactionStatus.APPROVED && tx.approved_at) {
        line += ` (Approved ${formatDate(tx.approved_at)})`;
      }
      text += line + "\n";
    }
  }

  text += `\nCurrent Balance: ${balance} units`;
  return text;
}

export default function StudentPayoutTimeline({
  studentId,
  studentName = "Student",
}: StudentPayoutTimelineProps) {
  const { data, isLoading } = useStudentTimeline(studentId);
  const toast = useToast();

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  const grouped = useMemo(() => groupByMonth(transactions), [transactions]);

  const handleShare = () => {
    const text = buildShareText(studentName, balance, grouped);
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500">
        Loading timeline...
      </div>
    );
  }

  return (
    <div>
      {/* Header with balance and share button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide dark:text-white/50">
            Current Balance
          </h4>
          <p
            className={`text-3xl font-bold mt-1 ${
              balance > 0
                ? "text-green-600 dark:text-green-400"
                : balance < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-800 dark:text-white/90"
            }`}
          >
            {balance > 0 ? "+" : ""}
            {Number.isInteger(balance) ? balance : balance.toFixed(2)} units
          </p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Last 2 Months
        </button>
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No transactions yet
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label}>
              {/* Month header */}
              <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wide">
                {group.label}
              </h5>

              {/* Timeline items */}
              <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                {group.items.map((tx) => {
                  const isCredit = tx.units > 0;
                  return (
                    <div key={tx.id} className="relative">
                      {/* Dot */}
                      <div
                        className={`absolute -left-[25px] top-1.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900 ${
                          isCredit
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />

                      {/* Card */}
                      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-lg px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-semibold text-sm ${
                                  isCredit
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {isCredit ? "+" : ""}
                                {tx.units} units
                              </span>
                              <Badge
                                size="sm"
                                color={
                                  isCredit ? "success" : "error"
                                }
                              >
                                {TYPE_LABELS[tx.type] || tx.type}
                              </Badge>
                              <Badge
                                size="sm"
                                color={STATUS_COLORS[tx.status] || "light"}
                              >
                                {tx.status}
                              </Badge>
                            </div>

                            {/* Reason — already contains breakdown for cron deductions */}
                            {tx.reason && (
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                {tx.reason}
                              </p>
                            )}
                          </div>

                          {/* Date */}
                          <span className="text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(tx.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
