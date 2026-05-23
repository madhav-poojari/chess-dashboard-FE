import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAuth } from "../../context/AuthContext";
import { fetchStudents, fetchCoaches } from "../../api/user/service";
import { User, UserRole } from "../../api/user/dto";
import { Attendance, deleteAttendance, listAttendances, ListAttendancesParams } from "../../api/attendance/service";
import AddAttendanceModal from "./AddAttendanceModal";
import EditAttendanceModal from "./EditAttendanceModal";
import AttendanceTable from "./AttendanceTable";
import { AttendanceShareCard } from "../../components/share";
import { queryKeys } from "../../constants/queryKeys";

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

export default function AttendancePage() {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase().trim() as UserRole;
  const canSeeCoachOverview = role === UserRole.MENTOR_COACH || role === UserRole.ADMIN;
  const canSeeOthers = role === UserRole.COACH;

  const [activeTab, setActiveTab] = useState<TabType>("student_overview");
  const [monthValue, setMonthValue] = useState<string>(monthInputDefault());

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Attendance | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // ─── Fetch dropdown options ───────────────────────────────────────
  const { data: students = [] } = useQuery<User[]>({
    queryKey: queryKeys.users.students(),
    queryFn: fetchStudents,
    staleTime: 5 * 60 * 1000,
  });

  const { data: coaches = [] } = useQuery<User[]>({
    queryKey: queryKeys.users.coaches(),
    queryFn: fetchCoaches,
    staleTime: 5 * 60 * 1000,
    enabled: canSeeCoachOverview,
  });

  // ─── Default selections ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (!selectedCoachId && coaches.length > 0) {
      setSelectedCoachId(coaches[0].id);
    }
  }, [coaches, selectedCoachId]);

  // ─── Attendance query ─────────────────────────────────────────────
  const parsed = parseMonthInput(monthValue);

  const isOthersSelected = selectedStudentId === "__others__";

  const attendanceQueryKey = useMemo(() => {
    if (!parsed) return queryKeys.attendance.list({ year: 0, month: 0 });
    return queryKeys.attendance.list({
      year: parsed.year,
      month: parsed.month,
      studentId: activeTab === "student_overview" && !isOthersSelected ? selectedStudentId : undefined,
      coachId: activeTab === "coach_overview" ? selectedCoachId : undefined,
      excludeOwn: activeTab === "student_overview" && isOthersSelected ? true : undefined,
    });
  }, [parsed, activeTab, selectedStudentId, selectedCoachId, isOthersSelected]);

  const canFetch = useMemo(() => {
    if (!parsed) return false;
    if (activeTab === "student_overview" && !selectedStudentId) return false;
    if (activeTab === "coach_overview" && !selectedCoachId) return false;
    return true;
  }, [parsed, activeTab, selectedStudentId, selectedCoachId]);

  const {
    data: attendances = [],
    isLoading: loading,
    error: queryError,
  } = useQuery<Attendance[]>({
    queryKey: attendanceQueryKey,
    queryFn: async () => {
      if (!parsed) return [];
      const params: ListAttendancesParams = { year: parsed.year, month: parsed.month };
      if (activeTab === "student_overview") {
        if (isOthersSelected) {
          params.exclude_own_students = true;
        } else if (selectedStudentId) {
          params.student_id = selectedStudentId;
        }
      }
      if (activeTab === "coach_overview" && selectedCoachId) {
        params.coach_id = selectedCoachId;
      }
      const res = await listAttendances(params);
      return Array.isArray(res) ? res : [];
    },
    enabled: canFetch,
    staleTime: 60 * 1000,
  });

  const error = queryError
    ? (queryError as { response?: { data?: { message?: string; error?: string } }; message?: string }).response?.data?.message ||
      (queryError as { message?: string }).message ||
      "Failed to load attendance"
    : "";

  // ─── Delete handler ───────────────────────────────────────────────
  const handleDelete = async (a: Attendance) => {
    const label = a.student
      ? `${a.student.first_name} ${a.student.last_name}`
      : a.student_id;
    const dateStr = a.date && a.date.length >= 10 ? a.date.slice(0, 10) : a.date;
    if (!window.confirm(`Delete attendance for ${label} on ${dateStr}? This cannot be undone.`)) return;
    setDeleting(a.id);
    try {
      await deleteAttendance(a.id);
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    } catch (err: unknown) {
      console.error("Delete attendance failed", err);
    } finally {
      setDeleting(null);
    }
  };

  const invalidateAttendances = () => {
    queryClient.invalidateQueries({ queryKey: ["attendances"] });
  };

  // ─── Share card helpers ───────────────────────────────────────────
  const shareMonthLabel = useMemo(() => {
    if (!parsed) return "";
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${months[parsed.month - 1]} ${parsed.year}`;
  }, [parsed]);

  const sharePersonName = useMemo(() => {
    if (activeTab === "student_overview") {
      if (isOthersSelected) return "Others";
      const s = students.find((x) => x.id === selectedStudentId);
      return s ? `${s.first_name} ${s.last_name}` : "";
    }
    const c = coaches.find((x) => x.id === selectedCoachId);
    return c ? `${c.first_name} ${c.last_name}` : "";
  }, [activeTab, selectedStudentId, selectedCoachId, students, coaches, isOthersSelected]);

  // Derived values for share card
  const shareMonthLabel = useMemo(() => {
    const parsed = parseMonthInput(monthValue);
    if (!parsed) return "";
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${months[parsed.month - 1]} ${parsed.year}`;
  }, [monthValue]);

  const sharePersonName = useMemo(() => {
    if (activeTab === "student_overview") {
      const s = studentOptions.find((x) => x.id === selectedStudentId);
      return s ? `${s.first_name} ${s.last_name}` : "";
    }
    const c = coachOptions.find((x) => x.id === selectedCoachId);
    return c ? `${c.first_name} ${c.last_name}` : "";
  }, [activeTab, selectedStudentId, selectedCoachId, studentOptions, coachOptions]);

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
                {students.length === 0 && (
                  <option value="" disabled>
                    No students found
                  </option>
                )}
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-gray-800">
                    {s.first_name} {s.last_name} ({s.email})
                  </option>
                ))}
                {canSeeOthers && (
                  <option value="__others__" className="dark:bg-gray-800">
                    Others (non-assigned students)
                  </option>
                )}
              </select>
            </div>
          )}

          {activeTab === "coach_overview" && (
            <div className="min-w-[260px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coach / Mentor
              </label>
              <select
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
              >
                {coaches.length === 0 && (
                  <option value="" disabled>
                    No coaches found
                  </option>
                )}
                {coaches.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-gray-800">
                    {c.first_name} {c.last_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          {attendances.length > 0 && (
            <AttendanceShareCard
              attendances={attendances}
              viewType={activeTab}
              monthLabel={shareMonthLabel}
              personName={sharePersonName}
            />
          )}
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
        ) : (
          <AttendanceTable
            attendances={attendances}
            viewType={activeTab}
            onEdit={setEditTarget}
            onDelete={handleDelete}
            deletingId={deleting}
          />
        )}
      </div>

      <AddAttendanceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={invalidateAttendances}
      />

      <EditAttendanceModal
        isOpen={!!editTarget}
        attendance={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={invalidateAttendances}
      />
    </div>
  );
}
