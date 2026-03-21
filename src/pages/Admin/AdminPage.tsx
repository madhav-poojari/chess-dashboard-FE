import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  fetchUnapprovedUsers,
  fetchStudentsWithAssignments,
  fetchCoachesWithAssignments,
  approveUser,
  setStudentCoachAssignment,
  setCoachMentorAssignment,
  createUser,
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
import { EyeCloseIcon, EyeIcon, MoreDotIcon } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";

type TabType = "pending" | "students" | "coaches" | "add-user";

export default function AdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);
  const [assigningCoachId, setAssigningCoachId] = useState<string | null>(null);
  const [selectedCoachForStudent, setSelectedCoachForStudent] = useState<Record<string, string>>({});
  const [selectedMentorForCoach, setSelectedMentorForCoach] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateType, setUpdateType] = useState<"student" | "coach" | null>(null);
  const [updateTargetId, setUpdateTargetId] = useState<string | null>(null);
  const [updateSelectedCoach, setUpdateSelectedCoach] = useState<string>("");
  const [updateSelectedMentor, setUpdateSelectedMentor] = useState<string>("");
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: unapprovedUsers = [], isLoading: unapprovedLoading } = useQuery<User[]>({
    queryKey: ["admin", "unapproved-users"],
    queryFn: fetchUnapprovedUsers,
    enabled: !!user && isAdmin,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentWithAssignment[]>({
    queryKey: ["admin", "students"],
    queryFn: fetchStudentsWithAssignments,
    enabled: !!user && isAdmin,
  });

  const { data: coaches = [], isLoading: coachesLoading } = useQuery<CoachWithAssignment[]>({
    queryKey: ["admin", "coaches"],
    queryFn: fetchCoachesWithAssignments,
    enabled: !!user && isAdmin,
  });

  const loading = unapprovedLoading || studentsLoading || coachesLoading;

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const studentAssignmentMutation = useMutation({
    mutationFn: async (vars: { studentId: string; coachId: string }) =>
      setStudentCoachAssignment(vars.studentId, vars.coachId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "coaches"] });
    },
  });

  const coachMentorMutation = useMutation({
    mutationFn: async (vars: { coachId: string; mentorCoachId: string }) =>
      setCoachMentorAssignment(vars.coachId, vars.mentorCoachId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "coaches"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        setNewUserForm({
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          role: "student",
        });
      alert("User created successfully!");
    },
  });

  const handleApprove = async (userId: string) => {
    try {
      await approveMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user");
    }
  };

  const handleAssignStudent = async (studentId: string, coachId: string) => {
    if (!coachId) return;

    try {
      setAssigningStudentId(studentId);
      await studentAssignmentMutation.mutateAsync({ studentId, coachId });
      setSelectedCoachForStudent({ ...selectedCoachForStudent, [studentId]: "" });
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
      await coachMentorMutation.mutateAsync({ coachId, mentorCoachId });
      setSelectedMentorForCoach({ ...selectedMentorForCoach, [coachId]: "" });
    } catch (error) {
      console.error("Error assigning mentor:", error);
      alert("Failed to assign mentor");
    } finally {
      setAssigningCoachId(null);
    }
  };

  const handleUpdateAssignment = (type: "student" | "coach", id: string) => {
    setUpdateType(type);
    setUpdateTargetId(id);
    setUpdateModalOpen(true);
    setOpenMenuId(null);

    if (type === "student") {
      const student = students.find(s => s.id === id);
      setUpdateSelectedCoach(student?.coach_id || "");
    } else {
      const coach = coaches.find(c => c.id === id && c.role === "coach");
      setUpdateSelectedMentor(coach?.mentor_coach_id || "");
    }
  };

  const handleSaveUpdate = async () => {
    if (!updateTargetId || !updateType) return;

    try {
      if (updateType === "student") {
        await studentAssignmentMutation.mutateAsync({ studentId: updateTargetId, coachId: updateSelectedCoach });
      } else {
        await coachMentorMutation.mutateAsync({ coachId: updateTargetId, mentorCoachId: updateSelectedMentor });
      }
      setUpdateModalOpen(false);
      setUpdateType(null);
      setUpdateTargetId(null);
      setUpdateSelectedCoach("");
      setUpdateSelectedMentor("");
    } catch (error) {
      console.error("Error updating assignment:", error);
      alert("Failed to update assignment");
    }
  };

  const handleRemoveAssignment = async (type: "student" | "coach", id: string) => {
    if (!confirm(`Are you sure you want to remove this assignment?`)) return;

    try {
      if (type === "student") {
        await studentAssignmentMutation.mutateAsync({ studentId: id, coachId: "" });
      } else {
        await coachMentorMutation.mutateAsync({ coachId: id, mentorCoachId: "" });
      }
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error removing assignment:", error);
      alert("Failed to remove assignment");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

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
          <button
            onClick={() => setActiveTab("add-user")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("add-user")}`}
          >
            Add User
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
                    {isAdmin && (
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-12"
                      >
                        {" "}
                      </TableCell>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 4 : 3}
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
                        {isAdmin && (
                          <TableCell className="px-5 py-4 text-start relative">
                            <div className="relative" ref={openMenuId === `student-${student.id}` ? menuRef : null}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === `student-${student.id}` ? null : `student-${student.id}`)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                              >
                                <MoreDotIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              </button>
                              {openMenuId === `student-${student.id}` && (
                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                  {student.coach_id && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateAssignment("student", student.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        Update Assignment
                                      </button>
                                      <button
                                        onClick={() => handleRemoveAssignment("student", student.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        Remove Assignment
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
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
                    {isAdmin && (
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-12"
                      >
                        {" "}
                      </TableCell>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {coaches.filter(c => c.role === "coach").length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 4 : 3}
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
                        {isAdmin && (
                          <TableCell className="px-5 py-4 text-start relative">
                            <div className="relative" ref={openMenuId === `coach-${coach.id}` ? menuRef : null}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === `coach-${coach.id}` ? null : `coach-${coach.id}`)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                              >
                                <MoreDotIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              </button>
                              {openMenuId === `coach-${coach.id}` && (
                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                  {coach.mentor_coach_id && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateAssignment("coach", coach.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        Update Assignment
                                      </button>
                                      <button
                                        onClick={() => handleRemoveAssignment("coach", coach.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        Remove Assignment
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Add User Tab */}
        {activeTab === "add-user" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4">
              <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
                Create New User
              </h3>
            </div>
            <div className="p-6 max-w-2xl">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCreatingUser(true);
                  try {
                    await createUserMutation.mutateAsync(newUserForm);
                  } catch (error) {
                    console.error("Error creating user:", error);
                    alert("Failed to create user");
                  } finally {
                    setCreatingUser(false);
                  }
                }}
              >
                <div className="space-y-6">
                  <div>
                    <Label>
                      Role <span className="text-error-500">*</span>
                    </Label>
                    <Select
                      options={[
                        { value: "student", label: "Student" },
                        { value: "coach", label: "Coach" },
                        { value: "mentor", label: "Mentor Coach" },
                      ]}
                      placeholder="Select Role"
                      onChange={(role) =>
                        setNewUserForm((prev) => ({
                          ...prev,
                          role,
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        First Name <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        name="first_name"
                        value={newUserForm.first_name}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            first_name: e.target.value,
                          }))
                        }
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label>
                        Last Name <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        name="last_name"
                        value={newUserForm.last_name}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            last_name: e.target.value,
                          }))
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      name="email"
                      value={newUserForm.email}
                      onChange={(e) =>
                        setNewUserForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="example@gmail.com"
                      required
                    />
                  </div>

                  <div>
                    <Label>
                      Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={newUserForm.password}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Enter password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewUserForm({
                          email: "",
                          password: "",
                          first_name: "",
                          last_name: "",
                          role: "student",
                        })
                      }
                      type="button"
                    >
                      Clear
                    </Button>
                    <Button type="submit" disabled={creatingUser}>
                      {creatingUser ? "Creating User..." : "Create User"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Update Assignment Modal */}
      {updateModalOpen && updateType && updateTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Update Assignment
            </h3>
            {updateType === "student" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Coach
                  </label>
                  <Select
                    options={[
                      { value: "", label: "None (Remove Assignment)" },
                      ...getAvailableCoaches()
                    ]}
                    placeholder="Select Coach"
                    onChange={(coachId) => setUpdateSelectedCoach(coachId)}
                    className="text-theme-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Mentor Coach
                  </label>
                  <Select
                    options={[
                      { value: "", label: "None (Remove Assignment)" },
                      ...getAvailableMentorCoaches()
                    ]}
                    placeholder="Select Mentor"
                    onChange={(mentorId) => setUpdateSelectedMentor(mentorId)}
                    className="text-theme-xs"
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateModalOpen(false);
                  setUpdateType(null);
                  setUpdateTargetId(null);
                  setUpdateSelectedCoach("");
                  setUpdateSelectedMentor("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveUpdate}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
