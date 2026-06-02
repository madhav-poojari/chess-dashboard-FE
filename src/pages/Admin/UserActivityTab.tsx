import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllUsers, setUserActive } from "../../api/admin/service";
import { listAttendances, Attendance } from "../../api/attendance/service";
import { User, UserRole } from "../../api/user/dto";
import { queryKeys } from "../../constants/queryKeys";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Compute the previous two months relative to now, handling year boundaries. */
function getPrevMonths() {
  const now = new Date();
  const currMonth = now.getMonth() + 1; // 1-indexed
  const currYear = now.getFullYear();

  let prevMonth = currMonth - 1;
  let prevYear = currYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  let twoAgoMonth = currMonth - 2;
  let twoAgoYear = currYear;
  if (twoAgoMonth < 1) {
    twoAgoMonth += 12;
    twoAgoYear -= 1;
  }

  return {
    prev: { month: prevMonth, year: prevYear },
    twoAgo: { month: twoAgoMonth, year: twoAgoYear },
  };
}

export default function UserActivityTab() {
  const queryClient = useQueryClient();
  const [manageRoleFilter, setManageRoleFilter] = useState<string>("all");
  const [attendanceThreshold, setAttendanceThreshold] = useState<string>("");

  const { prev, twoAgo } = useMemo(() => getPrevMonths(), []);

  // ── Data fetches ──────────────────────────────────────────────────

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: queryKeys.admin.allUsers(),
    queryFn: fetchAllUsers,
  });

  const { data: prevMonthAttendances = [] } = useQuery<Attendance[]>({
    queryKey: queryKeys.admin.adminAttendance(prev.year, prev.month),
    queryFn: () => listAttendances({ month: prev.month, year: prev.year }),
  });

  const { data: twoMonthsAgoAttendances = [] } = useQuery<Attendance[]>({
    queryKey: queryKeys.admin.adminAttendance(twoAgo.year, twoAgo.month),
    queryFn: () => listAttendances({ month: twoAgo.month, year: twoAgo.year }),
  });

  // ── Mutations ─────────────────────────────────────────────────────

  const toggleActiveMutation = useMutation({
    mutationFn: async (vars: { userId: string; active: boolean }) =>
      setUserActive(vars.userId, vars.active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.allUsers() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.students() });
    },
  });

  // ── Computed: attendance data per student ──────────────────────────

  const studentAttendanceData = useMemo(() => {
    const students = allUsers.filter(
      (u) =>
        u.role?.toLowerCase() === UserRole.STUDENT &&
        u.approved &&
        u.active
    );

    return students.map((student) => {
      const prevCount = prevMonthAttendances.filter(
        (a) => a.student_id === student.id
      ).length;
      const twoAgoCount = twoMonthsAgoAttendances.filter(
        (a) => a.student_id === student.id
      ).length;
      return {
        user: student,
        twoMonthsAgoCount: twoAgoCount,
        prevMonthCount: prevCount,
        difference: prevCount - twoAgoCount,
      };
    });
  }, [allUsers, prevMonthAttendances, twoMonthsAgoAttendances]);

  // ── Computed: manage users filtered list ───────────────────────────

  const filteredUsers = useMemo(
    () =>
      allUsers
        .filter((u) => u.approved)
        .filter((u) => u.role?.toLowerCase() !== UserRole.ADMIN)
        .filter((u) =>
          manageRoleFilter === "all"
            ? true
            : u.role?.toLowerCase() === manageRoleFilter
        ),
    [allUsers, manageRoleFilter]
  );

  // ── Derived values ─────────────────────────────────────────────────

  const thresholdNum = parseFloat(attendanceThreshold);
  const hasValidThreshold = !isNaN(thresholdNum) && thresholdNum > 0;

  const prevMonthName = MONTH_NAMES[prev.month - 1];
  const twoAgoMonthName = MONTH_NAMES[twoAgo.month - 1];

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Student Attendance Tracker Card ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
            Student Attendance Tracker
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-theme-xs dark:text-gray-400 whitespace-nowrap">
              Highlight if drop &gt;
            </span>
            <div className="w-24">
              <Input
                type="number"
                value={attendanceThreshold}
                onChange={(e) => setAttendanceThreshold(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Email
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  {twoAgoMonthName} Classes
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  {prevMonthName} Classes
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Difference
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {studentAttendanceData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500 text-theme-sm">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                studentAttendanceData.map((row) => {
                  const isHighlighted =
                    hasValidThreshold && row.difference <= -thresholdNum;
                  return (
                    <TableRow
                      key={row.user.id}
                      className={
                        isHighlighted ? "bg-red-50 dark:bg-red-900/10" : ""
                      }
                    >
                      <TableCell className="px-5 py-4 text-start">
                        <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {row.user.first_name} {row.user.last_name}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-gray-700 text-theme-sm dark:text-gray-300">
                          {row.user.email}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className="text-gray-700 text-theme-sm dark:text-gray-300">
                          {row.twoMonthsAgoCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className="text-gray-700 text-theme-sm dark:text-gray-300">
                          {row.prevMonthCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span
                          className={`font-medium text-theme-sm ${
                            row.difference > 0
                              ? "text-green-600 dark:text-green-400"
                              : row.difference < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {row.difference > 0
                            ? `+${row.difference}`
                            : row.difference}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Manage Users Card ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
            Manage Users
          </h3>
          <div className="w-48">
            <Select
              options={[
                { value: "all", label: "All Roles" },
                { value: UserRole.STUDENT, label: "Students" },
                { value: UserRole.COACH, label: "Coaches" },
                { value: UserRole.MENTOR_COACH, label: "Mentors" },
              ]}
              placeholder="Filter by Role"
              onChange={(val) => setManageRoleFilter(val)}
              className="text-theme-xs"
            />
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Email
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Role
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500 text-theme-sm">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-0.5">
                        {u.id}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-700 text-theme-sm dark:text-gray-300">
                        {u.email}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <Badge
                        size="sm"
                        color={
                          u.role?.toLowerCase() === UserRole.MENTOR_COACH
                            ? "primary"
                            : u.role?.toLowerCase() === UserRole.COACH
                              ? "info"
                              : "light"
                        }
                      >
                        {u.role?.toLowerCase() === UserRole.MENTOR_COACH
                          ? "Mentor"
                          : u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <Badge size="sm" color={u.active ? "success" : "error"}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <Button
                        size="sm"
                        variant={u.active ? "outline" : "primary"}
                        onClick={() => {
                          const action = u.active ? "deactivate" : "activate";
                          if (
                            confirm(
                              `Are you sure you want to ${action} ${u.first_name} ${u.last_name}?`
                            )
                          ) {
                            toggleActiveMutation.mutate({
                              userId: u.id,
                              active: !u.active,
                            });
                          }
                        }}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
