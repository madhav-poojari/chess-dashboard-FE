import { useNavigate } from "react-router";

interface StudentCardProps {
  studentId: string;
  firstName: string;
  lastName: string;
  lessonPlanTitle?: string;
  lessonPlanBody?: string;
  latestNoteTitle?: string;
  isLoading?: boolean;
}

export default function StudentCard({
  studentId,
  firstName,
  lastName,
  lessonPlanTitle,
  lessonPlanBody,
  latestNoteTitle,
  isLoading,
}: StudentCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/notes?studentId=${studentId}`);
  };

  // Truncate lesson plan body to ~120 chars
  const truncatedBody =
    lessonPlanBody && lessonPlanBody.length > 120
      ? lessonPlanBody.slice(0, 120) + "…"
      : lessonPlanBody;

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
    >
      {/* Student Name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm dark:bg-blue-900/30 dark:text-blue-400">
          {firstName.charAt(0)}{lastName.charAt(0)}
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {firstName} {lastName}
        </h3>
      </div>

      {/* Skeleton loading */}
      {isLoading ? (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Lesson Plan */}
          <div>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5">
              Lesson Plan
            </span>
            {lessonPlanTitle ? (
              <>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                  {lessonPlanTitle}
                </p>
                {truncatedBody && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {truncatedBody}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                No active plan
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-700"></div>

          {/* Latest Note */}
          <div>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-0.5">
              Latest Note
            </span>
            {latestNoteTitle ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                {latestNoteTitle}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                No notes
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hover arrow indicator */}
      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
}
