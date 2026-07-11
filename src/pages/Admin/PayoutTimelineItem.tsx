import { useState } from "react";
import { UnitTransaction, TransactionStatus } from "../../api/payouts/dto";
import { useApproveTransaction, useRejectTransaction } from "../../hooks/usePayouts";
import Badge from "../../components/ui/badge/Badge";
import { getImageUrl } from "../../utils/imageUrl";
import { TYPE_LABELS, TYPE_COLORS, STATUS_COLORS, formatDate } from "./payoutConstants";

interface PayoutTimelineItemProps {
  tx: UnitTransaction;
}

export default function PayoutTimelineItem({ tx }: PayoutTimelineItemProps) {
  const isCredit = tx.units > 0;
  const isPending = tx.status === TransactionStatus.PENDING;

  const approveMutation = useApproveTransaction();
  const rejectMutation = useRejectTransaction();

  const [isEditing, setIsEditing] = useState(false);
  const [editUnits, setEditUnits] = useState(String(tx.units));
  const [editReason, setEditReason] = useState(tx.reason);

  const handleApprove = () => {
    if (isEditing) {
      const parsedUnits = parseFloat(editUnits);
      approveMutation.mutate(
        {
          id: tx.id,
          units: !isNaN(parsedUnits) ? parsedUnits : undefined,
          reason: editReason !== tx.reason ? editReason : undefined,
        },
        { onSuccess: () => setIsEditing(false) }
      );
    } else {
      approveMutation.mutate({ id: tx.id });
    }
  };

  const handleReject = () => {
    rejectMutation.mutate(tx.id);
  };

  const startEdit = () => {
    setEditUnits(String(tx.units));
    setEditReason(tx.reason);
    setIsEditing(true);
  };

  const isBusy = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="relative">
      {/* Dot */}
      <div
        className={`absolute -left-[25px] top-1.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900 ${
          isPending
            ? "bg-yellow-500"
            : isCredit
              ? "bg-green-500"
              : "bg-red-500"
        }`}
      />

      {/* Card */}
      <div
        className={`rounded-lg px-4 py-3 border ${
          isPending
            ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/30"
            : "bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.05]"
        }`}
      >
        {/* Top row: units + badges + date */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditing ? (
                <input
                  type="number"
                  step="0.25"
                  value={editUnits}
                  onChange={(e) => setEditUnits(e.target.value)}
                  className="w-20 rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm text-center font-semibold text-gray-800 focus:border-brand-400 focus:outline-none dark:border-white/10 dark:text-white/90"
                />
              ) : (
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
              )}
              <Badge
                size="sm"
                color={TYPE_COLORS[tx.type] || "light"}
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

            {/* Reason */}
            {isEditing ? (
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={2}
                className="mt-2 w-full rounded-md border border-gray-300 bg-transparent px-2 py-1 text-xs text-gray-800 focus:border-brand-400 focus:outline-none dark:border-white/10 dark:text-white/90 resize-none"
              />
            ) : (
              tx.reason && (
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                  {tx.reason}
                </p>
              )
            )}

            {/* Screenshot link */}
            {tx.screenshot_url && (
              <a
                href={getImageUrl(tx.screenshot_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500 hover:underline text-xs mt-1 inline-flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View Screenshot
              </a>
            )}
          </div>

          {/* Date */}
          <span className="text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
            {formatDate(tx.created_at)}
          </span>
        </div>

        {/* Pending actions */}
        {isPending && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800/30">
            {isEditing ? (
              <>
                {/* Confirm edited */}
                <button
                  title="Confirm"
                  onClick={handleApprove}
                  disabled={isBusy}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                {/* Cancel edit */}
                <button
                  title="Cancel edit"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* Approve */}
                <button
                  title="Approve"
                  onClick={handleApprove}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors disabled:opacity-40 text-xs font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
                {/* Edit */}
                <button
                  title="Edit before approving"
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors text-xs font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                  Edit
                </button>
                {/* Reject */}
                <button
                  title="Reject"
                  onClick={handleReject}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors disabled:opacity-40 text-xs font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Decline
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
