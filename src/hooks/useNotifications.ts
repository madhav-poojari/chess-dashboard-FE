import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../context/ToastContext";
import { queryKeys } from "../constants/queryKeys";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
  type UnreadCountResponse,
} from "../api/notifications/service";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Polls unread notification count every 5 minutes.
 * Uses long staleTime to avoid redundant API calls.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: fetchUnreadCount,
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
  });
}

/**
 * Fetches the notification list. Only runs when `enabled` is true
 * (i.e. when the panel is open) to avoid unnecessary API calls.
 */
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => fetchNotifications(50, 0),
    enabled,
  });
}

/**
 * Marks a single notification as read with optimistic cache updates.
 * On success: updates both the list cache and unread count cache in-place.
 * On error: rolls back to previous state and shows a toast.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() });

      const prevNotifications = queryClient.getQueryData<NotificationItem[]>(
        queryKeys.notifications.list()
      );
      const prevCount = queryClient.getQueryData<UnreadCountResponse>(
        queryKeys.notifications.unreadCount()
      );

      // Optimistically mark item as read in the cached list
      if (prevNotifications) {
        queryClient.setQueryData<NotificationItem[]>(
          queryKeys.notifications.list(),
          prevNotifications.map((n) =>
            n.id === id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      }

      // Optimistically decrement unread count
      if (prevCount) {
        queryClient.setQueryData<UnreadCountResponse>(
          queryKeys.notifications.unreadCount(),
          { count: Math.max(0, prevCount.count - 1) }
        );
      }

      return { prevNotifications, prevCount };
    },

    onError: (_err, _id, context) => {
      if (context?.prevNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.prevNotifications);
      }
      if (context?.prevCount) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.prevCount);
      }
      toast.error("Failed to mark notification as read");
    },
  });
}

/**
 * Marks all notifications as read with optimistic cache updates.
 * On success: clears all unread indicators and shows a toast.
 * On error: rolls back and shows an error toast.
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() });

      const prevNotifications = queryClient.getQueryData<NotificationItem[]>(
        queryKeys.notifications.list()
      );
      const prevCount = queryClient.getQueryData<UnreadCountResponse>(
        queryKeys.notifications.unreadCount()
      );

      // Optimistically mark all as read
      if (prevNotifications) {
        queryClient.setQueryData<NotificationItem[]>(
          queryKeys.notifications.list(),
          prevNotifications.map((n) => ({
            ...n,
            is_read: true,
            read_at: n.read_at ?? new Date().toISOString(),
          }))
        );
      }

      queryClient.setQueryData<UnreadCountResponse>(
        queryKeys.notifications.unreadCount(),
        { count: 0 }
      );

      return { prevNotifications, prevCount };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.prevNotifications);
      }
      if (context?.prevCount) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.prevCount);
      }
      toast.error("Failed to mark all notifications as read");
    },

    onSuccess: () => {
      toast.success("All notifications marked as read");
    },
  });
}
