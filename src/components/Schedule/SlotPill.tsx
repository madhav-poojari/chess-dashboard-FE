import { ClassSchedule } from "../../api/schedule/service";
import { DAY_NAMES_SHORT, convertToIST, formatOriginalTime } from "../../utils/timezone";
import { PencilIcon, TrashBinIcon } from "../../icons";

interface SlotPillProps {
  slot: ClassSchedule;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SlotPill({ slot, onEdit, onDelete }: SlotPillProps) {
  // Staff view: IST day + time, original day + time in lighter text
  const { time12h, dayOfWeekIST } = convertToIST(slot.start_time, slot.timezone, slot.day_of_week);
  const originalWithDay = formatOriginalTime(slot.start_time, slot.timezone, slot.day_of_week);

  return (
    <div className="group flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm">
      <span className="font-medium text-brand-600 dark:text-brand-400 min-w-[32px]">
        {DAY_NAMES_SHORT[dayOfWeekIST]}
      </span>
      <span className="text-gray-800 dark:text-gray-200 font-medium">
        {time12h} IST
      </span>
      <span className="text-gray-400 dark:text-gray-500 text-xs">
        ({originalWithDay})
      </span>

      <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          title="Edit"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-error-50 dark:hover:bg-error-500/10 text-gray-500 dark:text-gray-400 hover:text-error-500"
          title="Delete"
        >
          <TrashBinIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
