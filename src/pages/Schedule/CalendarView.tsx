import { useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ClassSchedule } from "../../api/schedule/service";
import { slotToISTHour } from "../../utils/timezone";

/* ────────────────── helpers ────────────────── */

/**
 * Given a schedule slot (recurring weekly) and a reference week start,
 * produce FullCalendar event objects for every occurrence of that slot
 * within the visible date range.
 */
function slotsToEvents(
  slots: ClassSchedule[],
  rangeStart: Date,
  rangeEnd: Date
): {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: { slot: ClassSchedule };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}[] {
  const palette = [
    { bg: "#ecf3ff", border: "#465fff", text: "#252dae" },
    { bg: "#ecfdf3", border: "#12b76a", text: "#054f31" },
    { bg: "#fff6ed", border: "#fb6514", text: "#7e2410" },
    { bg: "#fef3f2", border: "#f04438", text: "#7a271a" },
    { bg: "#f0f9ff", border: "#0ba5ec", text: "#0b4a6f" },
    { bg: "#fffaeb", border: "#f79009", text: "#7a2e0e" },
    { bg: "#f2f7ff", border: "#7a5af8", text: "#161950" },
  ];

  // Assign colors by student_id
  const studentIds = Array.from(new Set(slots.map((s) => s.student_id)));
  const colorMap = new Map<string, typeof palette[0]>();
  studentIds.forEach((id, i) => colorMap.set(id, palette[i % palette.length]));

  const events: ReturnType<typeof slotsToEvents> = [];

  // Iterate each day in the visible range
  const current = new Date(rangeStart);
  while (current < rangeEnd) {
    const dayOfWeek = current.getDay(); // 0=Sun..6=Sat

    for (const slot of slots) {
      // Convert student's time to IST and check if the IST day matches
      const { hourDecimal, dayOfWeekIST } = slotToISTHour(
        slot.start_time,
        slot.timezone,
        slot.day_of_week
      );

      if (dayOfWeekIST !== dayOfWeek) continue;

      const startHour = Math.floor(hourDecimal);
      const startMinute = Math.round((hourDecimal - startHour) * 60);

      const eventStart = new Date(current);
      eventStart.setHours(startHour, startMinute, 0, 0);

      const eventEnd = new Date(eventStart);
      eventEnd.setHours(eventStart.getHours() + 1);

      const color = colorMap.get(slot.student_id) || palette[0];
      const studentName = slot.student
        ? `${slot.student.first_name} ${slot.student.last_name}`
        : slot.student_id;

      events.push({
        id: `${slot.id}-${current.toISOString().slice(0, 10)}`,
        title: studentName,
        start: eventStart,
        end: eventEnd,
        extendedProps: { slot },
        backgroundColor: color.bg,
        borderColor: color.border,
        textColor: color.text,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return events;
}

/* ────────────────── component ────────────────── */

interface CalendarViewProps {
  slots: ClassSchedule[];
}

export default function CalendarView({ slots }: CalendarViewProps) {
  const [calView, setCalView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  });

  const events = useMemo(
    () => slotsToEvents(slots, dateRange.start, dateRange.end),
    [slots, dateRange]
  );

  const handleDatesSet = useCallback((info: { start: Date; end: Date }) => {
    setDateRange({ start: info.start, end: info.end });
  }, []);

  return (
    <div className="schedule-calendar rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] overflow-hidden">
      {/* View toggle */}
      <div className="flex items-center justify-end px-4 pt-4 gap-1">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          <button
            onClick={() => setCalView("timeGridWeek")}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
              calView === "timeGridWeek"
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setCalView("dayGridMonth")}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
              calView === "dayGridMonth"
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={calView}
        key={calView}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        events={events}
        datesSet={handleDatesSet}
        height="auto"
        contentHeight="auto"
        expandRows={true}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="01:00:00"
        allDaySlot={false}
        nowIndicator={true}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        eventDisplay="block"
        slotEventOverlap={false}
        eventContent={(arg) => {
          return (
            <div className="px-2 py-1 h-full overflow-hidden">
              <div className="text-xs font-semibold truncate">{arg.event.title}</div>
            </div>
          );
        }}
      />
    </div>
  );
}
