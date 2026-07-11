import { useState } from "react";
import { Modal } from "../../components/ui/modal";
import { useStudentTimeline } from "../../hooks/usePayouts";
import { formatBalance } from "./payoutConstants";
import PayoutAdjustForm from "./PayoutAdjustForm";
import PayoutTimeline from "./PayoutTimeline";

interface PayoutStudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export default function PayoutStudentDetailModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  studentEmail,
}: PayoutStudentDetailModalProps) {
  const { data, isLoading } = useStudentTimeline(studentId);
  const [showAdjustForm, setShowAdjustForm] = useState(false);

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4"
    >
      {/* Header */}
      <div className="mb-6 pr-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {studentName}
        </h3>
        <p className="text-gray-500 text-sm dark:text-gray-400 mt-0.5">
          {studentEmail}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px] text-gray-500">
          Loading...
        </div>
      ) : (
        <>
          {/* Balance */}
          <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide dark:text-white/50">
              Current Balance
            </div>
            <p
              className={`text-3xl font-bold mt-1 ${
                balance > 0
                  ? "text-green-600 dark:text-green-400"
                  : balance < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-800 dark:text-white/90"
              }`}
            >
              {formatBalance(balance)} units
            </p>
          </div>

          {/* Adjust units toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdjustForm((prev) => !prev)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                showAdjustForm
                  ? "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/20 dark:border-brand-800/40 dark:text-brand-400"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-white/[0.03] dark:border-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.05]"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adjust Units
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${showAdjustForm ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdjustForm && (
              <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-gray-900">
                <PayoutAdjustForm
                  studentId={studentId}
                  onSuccess={() => setShowAdjustForm(false)}
                />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-white/[0.05] mb-6" />

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4 uppercase tracking-wide">
              Transaction History
            </h4>
            <PayoutTimeline
              transactions={transactions}
              balance={balance}
              studentName={studentName}
            />
          </div>
        </>
      )}
    </Modal>
  );
}
