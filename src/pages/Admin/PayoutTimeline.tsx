import { useMemo } from "react";
import { UnitTransaction, TransactionStatus } from "../../api/payouts/dto";
import { useToast } from "../../context/ToastContext";
import PayoutTimelineItem from "./PayoutTimelineItem";
import { MONTH_NAMES, TYPE_LABELS, formatDate } from "./payoutConstants";

interface PayoutTimelineProps {
  transactions: UnitTransaction[];
  balance: number;
  studentName: string;
}

interface MonthGroup {
  label: string;
  year: number;
  month: number;
  items: UnitTransaction[];
}

/** Group transactions by month-year */
function groupByMonth(txs: UnitTransaction[]): MonthGroup[] {
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
  groups: MonthGroup[]
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

export default function PayoutTimeline({
  transactions,
  balance,
  studentName,
}: PayoutTimelineProps) {
  const toast = useToast();
  const grouped = useMemo(() => groupByMonth(transactions), [transactions]);

  const handleShare = () => {
    const text = buildShareText(studentName, balance, grouped);
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };

  if (grouped.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No transactions yet
      </div>
    );
  }

  return (
    <div>
      {/* Share button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors text-xs font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Last 2 Months
        </button>
      </div>

      {/* Grouped timeline */}
      <div className="space-y-8">
        {grouped.map((group) => (
          <div key={group.label}>
            {/* Month header */}
            <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wide">
              {group.label}
            </h5>

            {/* Timeline items */}
            <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
              {group.items.map((tx) => (
                <PayoutTimelineItem key={tx.id} tx={tx} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
