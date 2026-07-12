import { useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../api/user/dto";
import { StudentWithAssignment } from "../../api/admin/service";
import { StudentWithRelations } from "../../api/user/dto";
import {
  useStudentsQuery,
  useAdminStudentsQuery,
  useStudentNotesSummaryQueries,
  useNotesSummaryMap,
} from "../../hooks/useStudentQueries";
import StudentCard from "./StudentCard";

// Normalize admin StudentWithAssignment and coach/mentor StudentWithRelations
// into a common shape
interface NormalizedStudent {
  id: string;
  firstName: string;
  lastName: string;
  coachId?: string;
  coachName?: string;
  mentorId?: string;
  mentorName?: string;
}

function normalizeFromRelations(s: StudentWithRelations): NormalizedStudent {
  return {
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    coachId: s.coach_id,
    coachName: s.coach_name,
    mentorId: s.mentor_id,
    mentorName: s.mentor_name,
  };
}

function normalizeFromAssignment(s: StudentWithAssignment): NormalizedStudent {
  return {
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    coachId: s.coach_id,
    coachName: s.coach_name,
    mentorId: s.mentor_coach_id,
    mentorName: s.mentor_name,
  };
}

export default function StudentsPage() {
  const { user } = useAuth();
  const userRole = (user?.role?.toLowerCase().trim() ?? "") as UserRole;
  const isAdmin = userRole === UserRole.ADMIN;

  const { data: studentsRaw = [], isLoading: studentsLoading } =
    useStudentsQuery(!isAdmin);

  const { data: adminStudentsRaw = [], isLoading: adminStudentsLoading } =
    useAdminStudentsQuery(isAdmin);

  // Normalize both data sources into a common shape
  const students: NormalizedStudent[] = useMemo(() => {
    if (isAdmin) {
      return adminStudentsRaw.filter((s) => s.active).map(normalizeFromAssignment);
    }
    return studentsRaw.filter((s) => s.active).map(normalizeFromRelations);
  }, [isAdmin, studentsRaw, adminStudentsRaw]);

  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  const noteQueries = useStudentNotesSummaryQueries(studentIds);
  const notesSummaryMap = useNotesSummaryMap(studentIds, noteQueries);

  const isLoading = isAdmin ? adminStudentsLoading : studentsLoading;

  // ─── Render helpers per role ───────────────────────────────

  const renderStudentCard = (student: NormalizedStudent) => {
    const summary = notesSummaryMap.get(student.id);
    const noteQueryIdx = studentIds.indexOf(student.id);
    const noteLoading = noteQueryIdx >= 0 ? noteQueries[noteQueryIdx]?.isLoading : false;

    return (
      <StudentCard
        key={student.id}
        studentId={student.id}
        firstName={student.firstName}
        lastName={student.lastName}
        lessonPlanTitle={summary?.lessonPlanTitle}
        lessonPlanBody={summary?.lessonPlanBody}
        latestNoteTitle={summary?.latestNoteTitle}
        isLoading={noteLoading}
      />
    );
  };

  // Coach view: flat card grid
  const renderCoachView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map(renderStudentCard)}
    </div>
  );

  // Mentor view: grouped by coach
  const renderMentorView = () => {
    const grouped = new Map<string, NormalizedStudent[]>();
    const unassigned: NormalizedStudent[] = [];

    students.forEach((student) => {
      const key = student.coachName || "";
      if (!key) {
        unassigned.push(student);
      } else {
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(student);
      }
    });

    return (
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([coachName, groupStudents]) => (
          <div key={coachName}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {coachName.split(" ").map(n => n.charAt(0)).join("")}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {coachName}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {groupStudents.length} student{groupStudents.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupStudents.map(renderStudentCard)}
            </div>
          </div>
        ))}
        {unassigned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">?</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                Unassigned
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {unassigned.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassigned.map(renderStudentCard)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Admin view: grouped by mentor -> coach -> students
  const renderAdminView = () => {
    const mentorMap = new Map<string, Map<string, NormalizedStudent[]>>();
    const noMentorCoachMap = new Map<string, NormalizedStudent[]>();
    const fullyUnassigned: NormalizedStudent[] = [];

    students.forEach((student) => {
      const mentorKey = student.mentorName || "";
      const coachKey = student.coachName || "";

      if (!mentorKey && !coachKey) {
        fullyUnassigned.push(student);
        return;
      }

      if (!mentorKey) {
        if (!noMentorCoachMap.has(coachKey)) noMentorCoachMap.set(coachKey, []);
        noMentorCoachMap.get(coachKey)!.push(student);
        return;
      }

      if (!mentorMap.has(mentorKey)) mentorMap.set(mentorKey, new Map());
      const coachMap = mentorMap.get(mentorKey)!;
      const ck = coachKey || "Unassigned Coach";
      if (!coachMap.has(ck)) coachMap.set(ck, []);
      coachMap.get(ck)!.push(student);
    });

    return (
      <div className="space-y-10">
        {Array.from(mentorMap.entries()).map(([mentorName, coachMap]) => (
          <div key={mentorName}>
            {/* Mentor heading */}
            <div className="flex items-center gap-2 mb-5">
              <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                  {mentorName.split(" ").map(n => n.charAt(0)).join("")}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {mentorName}
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                Mentor
              </span>
            </div>

            {/* Coach sub-groups */}
            <div className="ml-4 border-l-2 border-violet-200 dark:border-violet-800 pl-5 space-y-6">
              {Array.from(coachMap.entries()).map(([coachName, groupStudents]) => (
                <div key={coachName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {coachName.split(" ").map(n => n.charAt(0)).join("")}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                      {coachName}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {groupStudents.length} student{groupStudents.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupStudents.map(renderStudentCard)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Students with coach but no mentor */}
        {noMentorCoachMap.size > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">?</span>
              </div>
              <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400">
                No Mentor Assigned
              </h2>
            </div>
            <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-5 space-y-6">
              {Array.from(noMentorCoachMap.entries()).map(([coachName, groupStudents]) => (
                <div key={coachName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {coachName.split(" ").map(n => n.charAt(0)).join("")}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                      {coachName}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {groupStudents.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupStudents.map(renderStudentCard)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fully unassigned students */}
        {fullyUnassigned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-sm font-bold text-red-500 dark:text-red-400">!</span>
              </div>
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                Unassigned Students
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {fullyUnassigned.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fullyUnassigned.map(renderStudentCard)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Choose render based on role
  const renderContent = () => {
    if (userRole === UserRole.ADMIN) return renderAdminView();
    if (userRole === UserRole.MENTOR_COACH) return renderMentorView();
    return renderCoachView();
  };

  return (
    <>
      <PageMeta
        title="Students | BRS Academy"
        description="View all your students and their progress"
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-title-md2 font-semibold text-gray-900 dark:text-white">
            Students
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {students.length} active student{students.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading students…
            </span>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No students found
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Students assigned to you will appear here
            </p>
          </div>
        </div>
      ) : (
        renderContent()
      )}
    </>
  );
}
