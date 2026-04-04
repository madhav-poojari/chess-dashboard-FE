import React, { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import {
  Attendance,
  AttendanceClassType,
  UpdateAttendancePayload,
  updateAttendance,
} from "../../api/attendance/service";

type Props = {
  isOpen: boolean;
  attendance: Attendance | null;
  onClose: () => void;
  onSuccess: () => void;
};

const CLASS_TYPES: { value: AttendanceClassType; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "game_session", label: "Game session" },
  { value: "dual", label: "Dual" },
  { value: "substitution", label: "Substitution" },
];

function formatDateForInput(iso: string): string {
  if (!iso) return "";
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditAttendanceModal({
  isOpen,
  attendance,
  onClose,
  onSuccess,
}: Props) {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase().trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [classType, setClassType] = useState<AttendanceClassType>("regular");
  const [date, setDate] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [classHighlights, setClassHighlights] = useState<string>("");
  const [homework, setHomework] = useState<string>("");

  const canSetVerified = role === "admin" || role === "mentor";

  useEffect(() => {
    if (!isOpen || !attendance) return;
    setError("");
    setLoading(false);
    setClassType(attendance.class_type);
    setDate(formatDateForInput(attendance.date));
    setIsVerified(attendance.is_verified);
    setClassHighlights(attendance.class_highlights || "");
    setHomework(attendance.homework || "");
  }, [isOpen, attendance]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendance) return;
    setError("");

    if (!date) {
      setError("Please choose a date.");
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      setError("Cannot set attendance to a future date.");
      return;
    }

    setLoading(true);
    try {
      const payload: UpdateAttendancePayload = {
        class_type: classType,
        date,
        class_highlights: classHighlights || undefined,
        homework: homework || undefined,
      };
      if (canSetVerified) {
        payload.is_verified = isVerified;
      }

      await updateAttendance(attendance.id, payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Update attendance failed", err);
      const e2 = err as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      setError(
        e2.response?.data?.message ||
          e2.response?.data?.error ||
          e2.message ||
          "Failed to update attendance"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!attendance) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-0">
      <div className="p-4 sm:p-6">
        <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">
          Edit Attendance
        </h3>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Read-only context */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Student: </span>
            {attendance.student
              ? `${attendance.student.first_name} ${attendance.student.last_name}`
              : attendance.student_id}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Coach: </span>
            {attendance.coach
              ? `${attendance.coach.first_name} ${attendance.coach.last_name}`
              : attendance.coach_id}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class type
              </label>
              <select
                value={classType}
                onChange={(e) =>
                  setClassType(e.target.value as AttendanceClassType)
                }
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
              >
                {CLASS_TYPES.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                    className="dark:bg-gray-800"
                  >
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date (MM-DD-YYYY)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayYYYYMMDD()}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
                required
              />
            </div>
          </div>

          {canSetVerified && (
            <div className="flex items-center gap-2">
              <input
                id="edit-verified"
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="edit-verified"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Verified
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Class highlights
            </label>
            <textarea
              value={classHighlights}
              onChange={(e) => setClassHighlights(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
              placeholder="What did you cover?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Homework
            </label>
            <textarea
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
              placeholder="What should the student practice?"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
