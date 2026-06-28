import api from "../axiosInstance";
import { ApiResponse } from "../user/dto";

// --- Types ---

export type NotificationType =
  | "rating_milestone"
  | "tournament_played"
  | "joining_anniversary";

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

// --- API Calls ---

export const fetchNotifications = async (
  limit = 50,
  offset = 0
): Promise<NotificationItem[]> => {
  const res = await api.get(
    `/notifications?limit=${limit}&offset=${offset}`
  );
  const data: ApiResponse<NotificationItem[]> = res.data;
  return data.data ?? [];
};

export const fetchUnreadCount = async (): Promise<UnreadCountResponse> => {
  const res = await api.get("/notifications/unread-count");
  const data: ApiResponse<UnreadCountResponse> = res.data;
  return data.data ?? { count: 0 };
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};
