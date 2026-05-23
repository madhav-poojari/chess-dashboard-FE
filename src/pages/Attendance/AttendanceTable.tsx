import { Attendance } from "../../api/attendance/service";

interface AttendanceTableProps {
  attendances: Attendance[];
  /** Which column to display as the "other party" — coach (student view) or student (coach view) */
  viewType: "student_overview" | "coach_overview";
  onEdit: (a: Attendance) => void;
  onDelete: (a: Attendance) => void;
  deletingId: number | null;
}

function formatDateOnly(iso: string): string {
  if (!iso) return "";
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

export default function AttendanceTable({
  attendances,
  viewType,
  onEdit,
  onDelete,
  deletingId,
}: AttendanceTableProps) {
  if (attendances.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        No attendance records for this month.
      </p>
    );
  }

  const isStudentView = viewType === "student_overview";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-gray-200 dark:border-gray-800">
          <tr>
            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Date</th>
            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Type</th>
            <th className="text-left py-2 pr-4 text-gray-500 font-medium">
              {isStudentView ? "Coach" : "Student"}
            </th>
            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Verified</th>
            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Highlights</th>
            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Homework</th>
            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {attendances.map((a) => (
            <tr key={a.id}>
              <td className="py-3 pr-4 text-gray-800 dark:text-white/90">
                {formatDateOnly(a.date)}
              </td>
              <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">
                {a.class_type}
              </td>
              <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">
                {isStudentView
                  ? a.coach
                    ? `${a.coach.first_name} ${a.coach.last_name}`
                    : a.coach_id
                  : a.student
                  ? `${a.student.first_name} ${a.student.last_name}`
                  : a.student_id}
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
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(a)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(a)}
                    disabled={deletingId === a.id}
                    className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === a.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
