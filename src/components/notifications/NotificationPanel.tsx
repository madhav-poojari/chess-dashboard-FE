import { useCallback } from "react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "../../hooks/useNotifications";
import type { NotificationItem, NotificationType } from "../../api/notifications/service";

// --- Props ---

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Helpers ---

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "rating_milestone":
      return "🏆";
    case "tournament_played":
      return "♟️";
    case "joining_anniversary":
      return "🎉";
    default:
      return "🔔";
  }
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// --- Sub-components ---

const NotificationItemRow: React.FC<{
  notification: NotificationItem;
  onMarkAsRead: (id: string) => void;
}> = ({ notification, onMarkAsRead }) => {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-gray-100 dark:border-gray-800 ${
        notification.is_read
          ? "bg-transparent opacity-70"
          : "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      }`}
    >
      {/* Icon */}
      <span className="text-xl mt-0.5 shrink-0">
        {getNotificationIcon(notification.type)}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {notification.title}
          </p>
          {/* Unread dot */}
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {getRelativeTime(notification.created_at)}
        </p>
      </div>
    </button>
  );
};

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <span className="text-4xl mb-3">🔔</span>
    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
      No notifications yet
    </p>
    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
      You'll be notified about student milestones, tournaments, and more.
    </p>
  </div>
);

// --- Main Component ---

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { data: notifications, isLoading } = useNotifications(isOpen);
  const markAsReadMut = useMarkAsRead();
  const markAllAsReadMut = useMarkAllAsRead();

  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsReadMut.mutate(id);
    },
    [markAsReadMut]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMut.mutate();
  }, [markAllAsReadMut]);

  const hasUnread = notifications?.some((n) => !n.is_read) ?? false;

  return (
    <div
      className={`fixed inset-0 z-[99999] ${
        isOpen ? "" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMut.isPending}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close notifications"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <EmptyState />
          ) : (
            notifications.map((n) => (
              <NotificationItemRow
                key={n.id}
                notification={n}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
