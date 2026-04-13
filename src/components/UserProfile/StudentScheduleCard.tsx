import { UserRole, ClassScheduleDTO } from "../../api/user/dto";
import { DAY_NAMES, formatScheduleDisplay, STAFF_ROLES } from "../../utils/timezone";
import { CalenderIcon } from "../../icons";

interface StudentScheduleCardProps {
  schedule?: ClassScheduleDTO[];
  viewerRole?: string;
}

export default function StudentScheduleCard({
  schedule = [],
  viewerRole = UserRole.STUDENT,
}: StudentScheduleCardProps) {
  const displayRole = STAFF_ROLES.includes(viewerRole ?? "") ? viewerRole! : UserRole.STUDENT;

  if (schedule.length === 0) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Class Schedule
        </h4>
        <div className="text-center py-8">
          <CalenderIcon className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No classes scheduled yet
          </p>
        </div>
      </div>
    );
  }

  // Group by display day (may differ from stored day for staff due to TZ conversion)
  const byDay = new Map<number, { slot: ClassScheduleDTO; primary: string; secondary: string }[]>();
  for (const slot of schedule) {
    const { primary, secondary, displayDay } = formatScheduleDisplay(
      slot.start_time,
      slot.timezone,
      slot.day_of_week,
      displayRole
    );
    if (!byDay.has(displayDay)) {
      byDay.set(displayDay, []);
    }
    byDay.get(displayDay)!.push({ slot, primary, secondary });
  }

  // Sort days: Monday first (1,2,3,4,5,6,0)
  const sortedDays = Array.from(byDay.keys()).sort((a, b) => {
    const aAdj = a === 0 ? 7 : a;
    const bAdj = b === 0 ? 7 : b;
    return aAdj - bAdj;
  });

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Class Schedule
      </h4>
      <div className="space-y-3">
        {sortedDays.map((day) => {
          const dayItems = byDay.get(day)!;

          return (
            <div
              key={day}
              className="flex items-start gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 px-5 py-4"
            >
              <span className="font-semibold text-gray-800 dark:text-white/90 text-sm">
                {DAY_NAMES[day]}
              </span>

              <div className="flex flex-col gap-1.5">
                {dayItems.map(({ slot, primary, secondary }) => (
                  <span key={slot.id} className="text-sm">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{primary}</span>
                    {secondary && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs ml-1.5">{secondary}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
