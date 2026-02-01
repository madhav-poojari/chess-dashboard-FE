import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import { fetchStudents } from "../../api/user/service";
import { User } from "../../api/user/dto";
import { AttendanceClassType, createAttendance, CreateAttendancePayload } from "../../api/attendance/service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const CLASS_TYPES: { value: AttendanceClassType; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "game_session", label: "Game session" },
  { value: "dual", label: "Dual" },
  { value: "substitution", label: "Substitution" },
];

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddAttendanceModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase().trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [classType, setClassType] = useState<AttendanceClassType>("regular");
  const [date, setDate] = useState<string>(todayYYYYMMDD());
  const [sessionId, setSessionId] = useState<string>("");

  // Student selection (dropdown) for regular/dual
  const [students, setStudents] = useState<User[]>([]);
  const [studentId, setStudentId] = useState<string>("");
  const [studentId2, setStudentId2] = useState<string>(""); // dual

  // Free-text student id for substitution/game_session - now supports multiple
  const [freeTextStudentIds, setFreeTextStudentIds] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");

  // Optional coach override for mentor/admin
  const [coachId, setCoachId] = useState<string>("");

  const [classHighlights, setClassHighlights] = useState<string>("");
  const [homework, setHomework] = useState<string>("");

  const showStudentDropdown = classType === "regular" || classType === "dual";
  const showDualSecondStudent = classType === "dual";
  const showFreeTextStudent = classType === "substitution" || classType === "game_session";

  const canSetCoachId = role === "admin" || role === "mentor";

  const filteredStudents = useMemo(() => {
    // `/users` for admin returns all users; keep only students for the dropdown.
    return (students || []).filter((s) => (s.role || "").toLowerCase() === "student");
  }, [students]);

  // Helper to find student info by ID for chip display
  const getStudentInfo = (id: string): User | undefined => {
    return filteredStudents.find((s) => s.id === id);
  };

  const addStudentChip = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    if (freeTextStudentIds.includes(trimmed)) {
      setError(`Student ID "${trimmed}" is already added.`);
      return;
    }
    
    // Validate that the student ID exists
    const student = getStudentInfo(trimmed);
    if (!student) {
      setError(`Invalid student ID: "${trimmed}". Please enter a valid student ID.`);
      return;
    }
    
    setError(""); // Clear any previous errors
    setFreeTextStudentIds([...freeTextStudentIds, trimmed]);
    setCurrentInput("");
  };

  const removeStudentChip = (id: string) => {
    setFreeTextStudentIds(freeTextStudentIds.filter((sid) => sid !== id));
  };

  const handleChipInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addStudentChip(currentInput);
    } else if (e.key === "Backspace" && !currentInput && freeTextStudentIds.length > 0) {
      // Remove last chip on backspace if input is empty
      setFreeTextStudentIds(freeTextStudentIds.slice(0, -1));
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // reset per-open
    setError("");
    setLoading(false);
    setClassType("regular");
    setDate(todayYYYYMMDD());
    setSessionId("");
    setStudentId("");
    setStudentId2("");
    setFreeTextStudentIds([]);
    setCurrentInput("");
    setCoachId("");
    setClassHighlights("");
    setHomework("");

    // load students for dropdown options (coach/mentor/admin)
    (async () => {
      try {
        const data = await fetchStudents();
        setStudents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch students", e);
        setStudents([]);
      }
    })();
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!date) {
      setError("Please choose a date.");
      return;
    }

    // Prevent future dates
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59,999); // Reset time to start of day for comparison
    if (selectedDate > today) {
      setError("Cannot add attendance for future dates.");
      return;
    }

    if (showStudentDropdown && !studentId) {
      setError("Please select a student.");
      return;
    }
    if (showDualSecondStudent && (!studentId2 || studentId2 === studentId)) {
      setError("Please select a different second student for Dual.");
      return;
    }
    if (showFreeTextStudent && freeTextStudentIds.length === 0) {
      setError("Please add at least one student.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateAttendancePayload = {
        class_type: classType,
        date,
        session_id: sessionId || undefined,
        class_highlights: classHighlights || undefined,
        homework: homework || undefined,
      };

      if (canSetCoachId && coachId.trim()) {
        payload.coach_id = coachId.trim();
      }

      if (classType === "dual") {
        payload.student_ids = [studentId, studentId2].filter(Boolean);
      } else if (showStudentDropdown) {
        payload.student_id = studentId;
      } else if (showFreeTextStudent) {
        // Multiple student IDs for substitution/game_session
        if (freeTextStudentIds.length === 1) {
          payload.student_id = freeTextStudentIds[0];
        } else {
          payload.student_ids = freeTextStudentIds;
        }
      }

      await createAttendance(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Create attendance failed", err);
      const e2 = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setError(e2.response?.data?.message || e2.response?.data?.error || e2.message || "Failed to create attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-0">
      <div className="p-4 sm:p-6">
        <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">
          Add Attendance
        </h3>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4  ">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class type
              </label>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value as AttendanceClassType)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
              >
                {CLASS_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="dark:bg-gray-800">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date (MM/DD/YYYY)
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

          {canSetCoachId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coach ID (optional)
              </label>
              <input
                type="text"
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
                placeholder="Enter coach user id"
              />
            </div>
          )}

          {showStudentDropdown && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
                  required
                >
                  <option value="" disabled>
                    Select a student
                  </option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id} className="dark:bg-gray-800">
                      {s.first_name} {s.last_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              {showDualSecondStudent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student 2
                  </label>
                  <select
                    value={studentId2}
                    onChange={(e) => setStudentId2(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
                    required
                  >
                    <option value="" disabled>
                      Select second student
                    </option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id} className="dark:bg-gray-800">
                        {s.first_name} {s.last_name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {showFreeTextStudent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Students (type ID and press Enter or comma)
              </label>
              <div className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-gray-900 focus-within:border-blue-500 dark:border-gray-600 dark:text-white dark:focus-within:border-blue-500 min-h-[42px] flex flex-wrap gap-2 items-center">
                {freeTextStudentIds.map((id) => {
                  const student = getStudentInfo(id);
                  return (
                    <div
                      key={id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      <span>
                        {student
                          ? `${student.first_name} ${student.last_name} (${id})`
                          : id}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStudentChip(id)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors"
                        aria-label="Remove"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleChipInputKeyDown}
                  onBlur={() => {
                    if (currentInput.trim()) {
                      addStudentChip(currentInput);
                    }
                  }}
                  className="flex-1 min-w-[120px] bg-transparent outline-none border-none focus:ring-0 px-1"
                  placeholder={freeTextStudentIds.length === 0 ? "Enter student ID..." : ""}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Type student ID and press Enter or comma to add. Valid IDs will show student names.
              </p>
            </div>
          )}

          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session ID (optional)
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
                placeholder="Optional grouping/session identifier"
              />
            </div>
            <div />
          </div> */}

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
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

