import api from "../axiosInstance";
import { ApiResponse, User } from "../user/dto";

export interface ClassSchedule {
  id: number;
  student_id: string;
  student?: User;
  day_of_week: number; // 0=Sun..6=Sat
  start_time: string;  // "HH:MM" in student's timezone
  timezone: string;    // IANA timezone e.g. "America/New_York"
}

export type CreateSchedulePayload = {
  student_id: string;
  day_of_week: number;
  start_time: string;
  timezone: string;
};

export type UpdateSchedulePayload = Partial<Pick<ClassSchedule, "day_of_week" | "start_time" | "timezone">>;

export const listSchedules = async (): Promise<ClassSchedule[]> => {
  const res = await api.get("/schedules");
  const data: ApiResponse<ClassSchedule[]> = res.data;
  return data.data;
};

export const createSchedule = async (payload: CreateSchedulePayload): Promise<ClassSchedule> => {
  const res = await api.post("/schedules", payload);
  const data: ApiResponse<ClassSchedule> = res.data;
  return data.data;
};

export const updateSchedule = async (id: number, payload: UpdateSchedulePayload): Promise<ClassSchedule> => {
  const res = await api.patch(`/schedules/${id}`, payload);
  const data: ApiResponse<ClassSchedule> = res.data;
  return data.data;
};

export const deleteSchedule = async (id: number): Promise<void> => {
  await api.delete(`/schedules/${id}`);
};

