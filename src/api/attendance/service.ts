import api from "../axiosInstance";
import { ApiResponse, User } from "../user/dto";

export type AttendanceClassType = "regular" | "game_session" | "dual" | "substitution";

export interface Attendance {
  id: number;
  student_id: string;
  student?: User;
  coach_id: string;
  coach?: User;
  class_type: AttendanceClassType;
  date: string; // ISO string from API
  session_id?: string;
  is_verified: boolean;
  class_highlights?: string;
  homework?: string;
  created_at: string;
  updated_at: string;
}

export type ListAttendancesParams = {
  month: number;
  year: number;
  student_id?: string;
  coach_id?: string;
  class_type?: AttendanceClassType;
  session_id?: string;
  is_verified?: boolean;
};

export const listAttendances = async (params: ListAttendancesParams): Promise<Attendance[]> => {
  const res = await api.get("/attendances", { params });
  const data: ApiResponse<Attendance[]> = res.data;
  return data.data;
};

export type CreateAttendancePayload = {
  class_type: AttendanceClassType;
  date: string; // YYYY-MM-DD
  // Regular/Substitution/GameSession: student_id (dropdown or free text depending on UI)
  student_id?: string;
  // Dual: allow submitting multiple students (backend supports this)
  student_ids?: string[];
  // coach_id is optional; backend will force to self for coach users
  coach_id?: string;
  session_id?: string;
  class_highlights?: string;
  homework?: string;
};

export const createAttendance = async (payload: CreateAttendancePayload): Promise<Attendance | Attendance[]> => {
  const res = await api.post("/attendances", payload);
  const data: ApiResponse<Attendance | Attendance[]> = res.data;
  return data.data;
};

export const getAttendance = async (id: number): Promise<Attendance> => {
  const res = await api.get(`/attendances/${id}`);
  const data: ApiResponse<Attendance> = res.data;
  return data.data;
};

export type UpdateAttendancePayload = Partial<Pick<
  Attendance,
  "class_type" | "date" | "session_id" | "is_verified" | "class_highlights" | "homework"
>>;

export const updateAttendance = async (id: number, payload: UpdateAttendancePayload): Promise<Attendance> => {
  const res = await api.patch(`/attendances/${id}`, payload);
  const data: ApiResponse<Attendance> = res.data;
  return data.data;
};

export const deleteAttendance = async (id: number): Promise<void> => {
  await api.delete(`/attendances/${id}`);
};

