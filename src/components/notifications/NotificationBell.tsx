import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../api/user/dto";
import { useUnreadCount } from "../../hooks/useNotifications";

interface NotificationBellProps {
  onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { user } = useAuth();
  const { data } = useUnreadCount();

  // Only render for coach and mentor roles
  const allowedRoles: string[] = [UserRole.COACH, UserRole.MENTOR_COACH];
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  const unreadCount = data?.count ?? 0;

  return (
    <button
      id="notification-bell"
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      aria-label="Notifications"
    >
      {/* Bell icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
