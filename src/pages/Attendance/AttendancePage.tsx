import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAuth } from "../../context/AuthContext";
import { fetchStudents } from "../../api/user/service";
import { User } from "../../api/user/dto";
import { Attendance, listAttendances, ListAttendancesParams } from "../../api/attendance/service";
import AddAttendanceModal from "./AddAttendanceModal";

type TabType = "student_overview" | "coach_overview";

function monthInputDefault(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function parseMonthInput(v: string): { year: number; month: number } | null {
  // v is "YYYY-MM"
  const [y, m] = v.split("-");
  const year = Number(y);
  const month = Number(m);
  if (!year || !month || month < 1 || month > 12) return null;
  return { year, month };
}

function formatDateOnly(iso: string): string {
  // backend uses date type; in JSON it may include time; normalize.
  if (!iso) return "";
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase().trim();
  const canSeeCoachOverview = role === "mentor" || role === "admin";

  const [activeTab, setActiveTab] = useState<TabType>("student_overview");
  const [monthValue, setMonthValue] = useState<string>(monthInputDefault());

  const [students, setStudents] = useState<User[]>([]);
  const studentOptions = useMemo(
    () => (students || []).filter((s) => (s.role || "").toLowerCase() === "student"),
    [students]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [isAddOpen, setIsAddOpen] = useState(false);

  // load students for dropdowns (coach/mentor/admin)
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchStudents();
        setStudents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch students", e);
        setStudents([]);
      }
    })();
  }, []);

  // default student selection when list loads
  useEffect(() => {
    if (!selectedStudentId && studentOptions.length > 0) {
      setSelectedStudentId(studentOptions[0].id);
    }
  }, [studentOptions, selectedStudentId]);

  const loadAttendances = async () => {
    setError("");
    const parsed = parseMonthInput(monthValue);
    if (!parsed) {
      setError("Invalid month selected.");
      return;
    }
    setLoading(true);
    try {
      const params: ListAttendancesParams = { year: parsed.year, month: parsed.month };
      // Student overview is typically filtered by a student for readability
      if (activeTab === "student_overview" && selectedStudentId) {
        params.student_id = selectedStudentId;
      }
      const res = await listAttendances(params);
      setAttendances(Array.isArray(res) ? res : []);
    } catch (err: unknown) {
      console.error("Failed to load attendances", err);
      const e2 = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setError(e2.response?.data?.message || e2.response?.data?.error || e2.message || "Failed to load attendance");
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // For student overview, wait until we have a selected student (if there are options)
    if (activeTab === "student_overview" && studentOptions.length > 0 && !selectedStudentId) return;
    loadAttendances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, monthValue, selectedStudentId]);

  const groupedByCoach = useMemo(() => {
    const m = new Map<string, Attendance[]>();
    for (const a of attendances) {
      const key = a.coach?.id || a.coach_id || "unknown";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(a);
    }
    return Array.from(m.entries()).map(([key, items]) => ({
      key,
      coachName: items[0]?.coach ? `${items[0].coach.first_name} ${items[0].coach.last_name}` : key,
      items,
    }));
  }, [attendances]);

  return (
    <div>
      <PageMeta title="Attendance" description="Track class attendance" />
      <PageBreadcrumb pageTitle="Attendance" />

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Month
            </label>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => setMonthValue(e.target.value)}
              className="rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
            />
          </div>

          {activeTab === "student_overview" && (
            <div className="min-w-[260px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
              >
                {studentOptions.length === 0 && (
                  <option value="" disabled>
                    No students found
                  </option>
                )}
                {studentOptions.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-gray-800">
                    {s.first_name} {s.last_name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
          >
            Add attendance
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 max-w-2xl">
          <button
            onClick={() => setActiveTab("student_overview")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${
              activeTab === "student_overview"
                ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Student overview
          </button>
          {canSeeCoachOverview && (
            <button
              onClick={() => setActiveTab("coach_overview")}
              className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${
                activeTab === "coach_overview"
                  ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Coach overview
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : activeTab === "student_overview" ? (
          <>
            {attendances.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No attendance records for this month.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="text-left py-2 pr-4 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-medium">Type</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-medium">Coach</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-medium">Verified</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-medium">Highlights</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-medium">Homework</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {attendances.map((a) => (
                      <tr key={a.id}>
                        <td className="py-3 pr-4 text-gray-800 dark:text-white/90">{formatDateOnly(a.date)}</td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{a.class_type}</td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">
                          {a.coach ? `${a.coach.first_name} ${a.coach.last_name}` : a.coach_id}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">
                          {a.is_verified ? "Yes" : "No"}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">
                          {a.class_highlights || "-"}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">
                          {a.homework || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {groupedByCoach.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No attendance records for this month.</p>
            ) : (
              <div className="space-y-6">
                {groupedByCoach.map((g) => (
                  <div key={g.key} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-gray-800 dark:text-white/90">
                        {g.coachName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {g.items.length} record(s)
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="border-b border-gray-200 dark:border-gray-800">
                          <tr>
                            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Date</th>
                            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Type</th>
                            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Student</th>
                            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Verified</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                          {g.items.map((a) => (
                            <tr key={a.id}>
                              <td className="py-3 pr-4 text-gray-800 dark:text-white/90">{formatDateOnly(a.date)}</td>
                              <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{a.class_type}</td>
                              <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">
                                {a.student ? `${a.student.first_name} ${a.student.last_name}` : a.student_id}
                              </td>
                              <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{a.is_verified ? "Yes" : "No"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AddAttendanceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          loadAttendances();
        }}
      />
    </div>
  );
}

