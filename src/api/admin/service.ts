import api from "../axiosInstance";
import { ApiResponse, User } from "../user/dto";

export interface StudentWithAssignment extends User {
  coach_id?: string;
  mentor_coach_id?: string;
  assigned_at?: string;
}

export interface CoachWithAssignment extends User {
  student_id?: string;
  is_mentor: boolean;
  mentor_coach_id?: string;
  assigned_at?: string;
}

export const fetchUnapprovedUsers = async (): Promise<User[]> => {
  const res = await api.get("/admin/unapproved-users");
  const data: ApiResponse<User[]> = res.data;
  return data.data;
};

export const fetchStudentsWithAssignments = async (): Promise<StudentWithAssignment[]> => {
  const res = await api.get("/admin/students");
  const data: ApiResponse<StudentWithAssignment[]> = res.data;
  return data.data;
};

export const fetchCoachesWithAssignments = async (): Promise<CoachWithAssignment[]> => {
  const res = await api.get("/admin/coaches");
  const data: ApiResponse<CoachWithAssignment[]> = res.data;
  return data.data;
};

export const approveUser = async (userId: string): Promise<void> => {
  await api.post(`/admin/user/${userId}/approve`);
};

export const assignStudentToCoach = async (coachId: string, studentId: string): Promise<void> => {
  await api.post("/admin/assign-student", {
    coach_id: coachId,
    student_id: studentId,
  });
};

export const assignCoachAsMentor = async (
  mentorCoachId: string,
  studentId: string,
  coachId?: string
): Promise<void> => {
  await api.post("/admin/assign-mentor", {
    mentor_coach_id: mentorCoachId,
    student_id: studentId,
    coach_id: coachId || "",
  });
};

export const updateStudentAssignment = async (
  studentId: string,
  coachId: string
): Promise<void> => {
  await api.put("/admin/update-student-assignment", {
    student_id: studentId,
    coach_id: coachId,
  });
};

export const updateCoachMentorAssignment = async (
  coachId: string,
  mentorCoachId: string
): Promise<void> => {
  await api.put("/admin/update-coach-mentor", {
    coach_id: coachId,
    mentor_coach_id: mentorCoachId,
  });
};

export const resetUserPassword = async (
  userId: string,
  newPassword: string
): Promise<void> => {
  await api.post("/admin/reset-password", {
    user_id: userId,
    password: newPassword,
  });
};
