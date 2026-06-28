import { useReducer } from "react";
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

// ── Row-level edit state ──────────────────────────────────
interface RowEdits {
  [txId: number]: { units: string; reason: string };
}

interface CardState {
  editingRows: Set<number>;
  rowEdits: RowEdits;
}

type CardAction =
  | { type: "START_EDIT"; id: number; units: number; reason: string }
  | { type: "CANCEL_EDIT"; id: number }
  | { type: "SET_EDIT_FIELD"; id: number; field: "units" | "reason"; value: string }
  | { type: "CLEAR_EDIT"; id: number };

function cardReducer(state: CardState, action: CardAction): CardState {
  switch (action.type) {
    case "START_EDIT": {
      const editing = new Set(state.editingRows);
      editing.add(action.id);
      return {
        ...state,
        editingRows: editing,
        rowEdits: {
          ...state.rowEdits,
          [action.id]: { units: String(action.units), reason: action.reason },
        },
      };
    }
    case "CANCEL_EDIT":
    case "CLEAR_EDIT": {
      const editing = new Set(state.editingRows);
      editing.delete(action.id);
      const edits = { ...state.rowEdits };
      delete edits[action.id];
      return { ...state, editingRows: editing, rowEdits: edits };
    }
    case "SET_EDIT_FIELD": {
      return {
        ...state,
        rowEdits: {
          ...state.rowEdits,
          [action.id]: {
            ...state.rowEdits[action.id],
            [action.field]: action.value,
          },
        },
      };
    }
    default:
      return state;
  }
}

const initialState: CardState = {
  editingRows: new Set(),
  rowEdits: {},
};

export default function PayoutApprovalCard() {
  const { data: pending = [], isLoading } = usePendingTransactions();
  const approveMutation = useApproveTransaction();
  const rejectMutation = useRejectTransaction();
  const [state, dispatch] = useReducer(cardReducer, initialState);

  const handleApprove = (tx: UnitTransaction) => {
    const edit = state.rowEdits[tx.id];
    if (edit) {
      // Send with overrides
      const parsedUnits = parseFloat(edit.units);
      approveMutation.mutate(
        {
          id: tx.id,
          units: !isNaN(parsedUnits) ? parsedUnits : undefined,
          reason: edit.reason !== tx.reason ? edit.reason : undefined,
        },
        { onSuccess: () => dispatch({ type: "CLEAR_EDIT", id: tx.id }) }
      );
    } else {
      // Approve as-is
      approveMutation.mutate({ id: tx.id });
    }
  };

  const renderRow = (tx: UnitTransaction) => {
    const isEditing = state.editingRows.has(tx.id);
    const edit = state.rowEdits[tx.id];
    const studentName = tx.user
      ? `${tx.user.first_name} ${tx.user.last_name}`
      : tx.user_id;

    return (
      <TableRow key={tx.id}>
        {/* Student */}
        <TableCell className="px-5 py-4 text-start">
          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {studentName}
          </div>
          <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-0.5">
            {tx.user_id}
          </div>
        </TableCell>

        {/* Type */}
        <TableCell className="px-5 py-4 text-center">
          <Badge size="sm" color={TYPE_COLORS[tx.type as TransactionType] || "light"}>
            {TYPE_LABELS[tx.type as TransactionType] || tx.type}
          </Badge>
        </TableCell>

        {/* Units — editable */}
        <TableCell className="px-5 py-4 text-center">
          {isEditing ? (
            <input
              type="number"
              step="0.25"
              value={edit?.units ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_EDIT_FIELD", id: tx.id, field: "units", value: e.target.value })
              }
              className="w-20 rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm text-center text-gray-800 focus:border-brand-400 focus:outline-none dark:border-white/10 dark:text-white/90"
            />
          ) : (
            <span
              className={`font-medium text-theme-sm ${
                tx.units > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {tx.units > 0 ? `+${tx.units}` : tx.units}
            </span>
          )}
        </TableCell>

        {/* Reason — editable */}
        <TableCell className="px-5 py-4 text-start max-w-[200px]">
          {isEditing ? (
            <textarea
              value={edit?.reason ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_EDIT_FIELD", id: tx.id, field: "reason", value: e.target.value })
              }
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-white/10 dark:text-white/90 resize-none"
            />
          ) : (
            <div className="text-gray-700 text-theme-sm dark:text-gray-300">
              {tx.reason || "—"}
            </div>
          )}
        </TableCell>

        {/* Screenshot */}
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

        {/* Txn ID */}
        <TableCell className="px-5 py-4 text-center">
          <span className="text-gray-500 text-theme-xs dark:text-gray-400">
            {tx.transaction_id || "—"}
          </span>
        </TableCell>

        {/* Date */}
        <TableCell className="px-5 py-4 text-center">
          <span className="text-gray-500 text-theme-xs dark:text-gray-400">
            {formatDate(tx.created_at)}
          </span>
        </TableCell>

        {/* Actions */}
        <TableCell className="px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            {isEditing ? (
              <>
                {/* Confirm (tick) */}
                <button
                  title="Confirm"
                  onClick={() => handleApprove(tx)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                {/* Cancel (cross) */}
                <button
                  title="Cancel edit"
                  onClick={() => dispatch({ type: "CANCEL_EDIT", id: tx.id })}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* Approve (tick) */}
                <button
                  title="Approve"
                  onClick={() => handleApprove(tx)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                {/* Edit (pencil) */}
                <button
                  title="Edit before approving"
                  onClick={() =>
                    dispatch({
                      type: "START_EDIT",
                      id: tx.id,
                      units: tx.units,
                      reason: tx.reason,
                    })
                  }
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
                  </svg>
                </button>
                {/* Reject (cross) */}
                <button
                  title="Reject"
                  onClick={() => rejectMutation.mutate(tx.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
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
