import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  fetchUnapprovedUsers,
  fetchStudentsWithAssignments,
  fetchCoachesWithAssignments,
  approveUser,
  assignStudentToCoach,
  assignCoachAsMentor,
  StudentWithAssignment,
  CoachWithAssignment,
} from "../../api/admin/service";
import { User } from "../../api/user/dto";
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

type TabType = "pending" | "students" | "coaches";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [unapprovedUsers, setUnapprovedUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<StudentWithAssignment[]>([]);
  const [coaches, setCoaches] = useState<CoachWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);
  const [assigningCoachId, setAssigningCoachId] = useState<string | null>(null);
  const [selectedCoachForStudent, setSelectedCoachForStudent] = useState<Record<string, string>>({});
  const [selectedMentorForCoach, setSelectedMentorForCoach] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [unapproved, studentsData, coachesData] = await Promise.all([
        fetchUnapprovedUsers(),
        fetchStudentsWithAssignments(),
        fetchCoachesWithAssignments(),
      ]);
      setUnapprovedUsers(unapproved);
      setStudents(studentsData);
      setCoaches(coachesData);
      // Debug: log coaches with students to check mentor_coach_id
      console.log("Coaches with assignments:", coachesData.filter(c => c.student_id && !c.student_id.startsWith("T-")).map(c => ({
        email: c.email,
        student_id: c.student_id,
        mentor_coach_id: c.mentor_coach_id
      })));
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      await loadData();
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user");
    }
  };

  const handleAssignStudent = async (studentId: string, coachId: string) => {
    if (!coachId) return;

    try {
      setAssigningStudentId(studentId);
      await assignStudentToCoach(coachId, studentId);
      setSelectedCoachForStudent({ ...selectedCoachForStudent, [studentId]: "" });
      await loadData();
    } catch (error) {
      console.error("Error assigning student:", error);
      alert("Failed to assign student");
    } finally {
      setAssigningStudentId(null);
    }
  };

  const handleAssignMentor = async (coachId: string, mentorCoachId: string) => {
    if (!mentorCoachId) return;

    try {
      setAssigningCoachId(coachId);
      // Assign the selected mentor coach (mentorCoachId) to the coach (coachId)
      // If coach has students, mentor will be applied to all of them
      // If coach has no students yet, mentor will be applied when students are assigned later
      await assignCoachAsMentor(mentorCoachId, "", coachId);
      setSelectedMentorForCoach({ ...selectedMentorForCoach, [coachId]: "" });
      await loadData();
    } catch (error) {
      console.error("Error assigning mentor:", error);
      alert("Failed to assign mentor");
    } finally {
      setAssigningCoachId(null);
    }
  };

  // Get available coaches for dropdown
  const getAvailableCoaches = () => {
    return coaches
      .filter(c => !c.is_mentor && c.role === "coach")
      .map(c => ({
        value: c.id,
        label: `${c.first_name} ${c.last_name} (${c.email})`
      }));
  };

  // Get available mentor coaches for dropdown (only show coaches with mentor role)
  const getAvailableMentorCoaches = () => {
    return coaches
      .filter(c => c.role === "mentor")
      .map(c => ({
        value: c.id,
        label: `${c.first_name} ${c.last_name} (${c.email})`
      }));
  };

  if (loading) {
    return (
      <div>
        <PageMeta
          title="Admin Dashboard | Chess Dashboard"
          description="Admin dashboard for managing users, students, and coaches"
        />
        <PageBreadcrumb pageTitle="Admin Dashboard" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const getTabButtonClass = (tab: TabType) =>
    activeTab === tab
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div>
      <PageMeta
        title="Admin Dashboard | Chess Dashboard"
        description="Admin dashboard for managing users, students, and coaches"
      />
      <PageBreadcrumb pageTitle="Admin Dashboard" />
      
      {/* Tab Navigation */}
      <div className="mt-6 mb-6">
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 max-w-2xl">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("pending")}`}
          >
            Pending Approvals
            {unapprovedUsers.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {unapprovedUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("students")}`}
          >
            Assign Coach
          </button>
          <button
            onClick={() => setActiveTab("coaches")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("coaches")}`}
          >
            Assign Mentor Coach
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Pending Approvals Tab */}
        {activeTab === "pending" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4">
            <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
              Pending Approvals
            </h3>
          </div>
          <div className="max-w-full overflow-x-auto">
            {unapprovedUsers.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-theme-sm">
                No pending approvals
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {unapprovedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                        {user.email}
                      </div>
                      <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                        Role: {user.role}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      className="ml-4"
                    >
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4">
            <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
              Students
            </h3>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="px-5 py-8 text-center text-gray-500 text-theme-sm"
                    >
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <div>
                          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                            {student.email}
                          </div>
                          {student.coach_id && (
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                              Coach: {student.coach_id}
                            </div>
                          )}
                          {student.mentor_coach_id && (
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                              Mentor: {student.mentor_coach_id}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {student.coach_id || student.mentor_coach_id ? (
                          <Badge size="sm" color="success">
                            Assigned
                          </Badge>
                        ) : (
                          <Badge size="sm" color="warning">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {!student.coach_id ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[200px]">
                              <Select
                                options={getAvailableCoaches()}
                                placeholder="Select Coach"
                                onChange={(coachId) => setSelectedCoachForStudent({ ...selectedCoachForStudent, [student.id]: coachId })}
                                className="text-theme-xs"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignStudent(student.id, selectedCoachForStudent[student.id] || "")}
                              disabled={assigningStudentId === student.id || !selectedCoachForStudent[student.id]}
                            >
                              {assigningStudentId === student.id ? "Assigning..." : "Assign"}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-theme-xs">Assigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        )}

        {/* Coaches Tab */}
        {activeTab === "coaches" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4">
            <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
              Coaches
            </h3>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {coaches.filter(c => c.role === "coach").length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="px-5 py-8 text-center text-gray-500 text-theme-sm"
                    >
                      No coaches found
                    </TableCell>
                  </TableRow>
                ) : (
                  coaches.filter(c => c.role === "coach").map((coach, index) => (
                    <TableRow key={`${coach.id}-${index}`}>
                      <TableCell className="px-5 py-4 text-start">
                        <div>
                          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {coach.first_name} {coach.last_name}
                          </div>
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                            {coach.email}
                          </div>
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                            Role: {coach.role}
                          </div>
                          {coach.student_id && (
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                              Student: {coach.student_id}
                              {coach.is_mentor && " (as Mentor)"}
                            </div>
                          )}
                          {coach.mentor_coach_id && (
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                              Mentor: {(() => {
                                const mentor = coaches.find(m => m.id === coach.mentor_coach_id);
                                return mentor 
                                  ? `${mentor.first_name} ${mentor.last_name}` 
                                  : coach.mentor_coach_id;
                              })()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {(coach.student_id && !coach.student_id.startsWith("T-")) || coach.mentor_coach_id ? (
                          <Badge size="sm" color="success">
                            Assigned
                          </Badge>
                        ) : (
                          <Badge size="sm" color="warning">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {!coach.is_mentor && coach.role === "coach" ? (
                          coach.mentor_coach_id ? (
                            <span className="text-gray-500 text-theme-xs">
                              Mentor assigned
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-[200px]">
                                <Select
                                  options={getAvailableMentorCoaches()}
                                  placeholder="Select Mentor"
                                  onChange={(mentorCoachId) => setSelectedMentorForCoach({ ...selectedMentorForCoach, [coach.id]: mentorCoachId })}
                                  className="text-theme-xs"
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleAssignMentor(coach.id, selectedMentorForCoach[coach.id] || "")
                                }
                                disabled={assigningCoachId === coach.id || !selectedMentorForCoach[coach.id]}
                              >
                                {assigningCoachId === coach.id
                                  ? "Assigning..."
                                  : "Assign to Mentor"}
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="text-gray-500 text-theme-xs">
                            {coach.is_mentor ? "Already a mentor" : "N/A"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
