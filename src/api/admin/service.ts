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
  // Approval is just a user status update now.
  await api.put(`/admin/user/${userId}`, { approved: true });
};

export const setStudentCoachAssignment = async (
  studentId: string,
  coachId: string
): Promise<void> => {
  await api.put("/admin/assignments", {
    assignment_type: "student_coach",
    student_id: studentId,
    coach_id: coachId, // empty string removes assignment
  });
};

export const setCoachMentorAssignment = async (
  coachId: string,
  mentorCoachId: string
): Promise<void> => {
  await api.put("/admin/assignments", {
    assignment_type: "coach_mentor",
    coach_id: coachId,
    mentor_coach_id: mentorCoachId, // empty string removes mentor assignment
  });
};

export const createUser = async (userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}): Promise<User> => {
  
  const res = await api.post("/auth/signup", userData);
  const data: ApiResponse<User> = res.data;
  return data.data;
};

export const setUserActive = async (userId: string, active: boolean): Promise<void> => {
  await api.put(`/admin/user/${userId}`, { active });
};

export const fetchAllUsers = async (): Promise<User[]> => {
  const res = await api.get("/users/");
  const data: ApiResponse<User[]> = res.data;
  return data.data;
};
