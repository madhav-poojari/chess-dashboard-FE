import api from "../axiosInstance";
import { ApiResponse, User } from "../user/dto";

export interface StudentWithAssignment extends User {
  coach_id?: string;
  coach_name?: string;
  mentor_coach_id?: string;
  mentor_name?: string;
  assigned_at?: string;
}

export interface CoachWithAssignment extends User {
  mentor_coach_id?: string;
  mentor_name?: string;
}

export interface PickerItem {
  id: string;
  first_name: string;
  last_name: string;
  current_student_count: number;
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

export const fetchCoachesPicker = async (): Promise<PickerItem[]> => {
  const res = await api.get("/admin/coaches/picker");
  const data: ApiResponse<PickerItem[]> = res.data;
  return data.data;
};

export const fetchMentorsPicker = async (): Promise<PickerItem[]> => {
  const res = await api.get("/admin/mentors/picker");
  const data: ApiResponse<PickerItem[]> = res.data;
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

export const setStudentMentorAssignment = async (
  studentId: string,
  mentorId: string
): Promise<void> => {
  await api.put("/admin/assignments", {
    assignment_type: "student_mentor",
    student_id: studentId,
    mentor_id: mentorId, // empty string removes assignment
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
  phone: string;
  dob: string;
  bio: string;
  personal_meet_link: string;
  syllabus_url: string;
  added_in_whatsapp: boolean;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  lichess_username: string;
  chesscom_username: string;
  uscf_id: string;
  fide_id: string;
}): Promise<User> => {
  const {email, password, first_name, last_name, role, ...userDetailsPayload} = userData;
  const userPayload = {email, password, first_name, last_name, role};
  const res = await api.post("/auth/signup", userPayload);
  const userId = res.data.data.user_id;
  await api.put("/users/"+userId, userDetailsPayload);
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
