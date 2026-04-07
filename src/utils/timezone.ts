/**
 * Timezone utilities for schedule display using Luxon.
 *
 * Times in the DB are stored in the **student's local timezone**.
 * - Students: display as-is (their own timezone)
 * - Staff (coach/mentor/admin): convert to IST using Luxon (handles DST)
 */

import { DateTime } from "luxon";
import { UserRole } from "../api/user/dto";

const IST_ZONE = "Asia/Kolkata";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STAFF_ROLES: string[] = [UserRole.COACH, UserRole.MENTOR_COACH, UserRole.ADMIN];

/* ──── Time parsing / formatting ──── */

function formatTime12h(dt: DateTime): string {
  return dt.toFormat("h:mm a");
}

// Get the short timezone abbreviation for an IANA timezone (e.g. "EST", "IST").
export function getTimezoneAbbr(timezone: string): string {
  const dt = DateTime.now().setZone(timezone);
  return dt.toFormat("ZZZZ") || dt.toFormat("ZZ");
}

/**
 * Convert a student's local time to IST using Luxon.
 * Returns the IST start time (12h format) and the IST day of week.
 */
export function convertToIST(
  startTime: string,
  timezone: string,
  dayOfWeek: number
): { time12h: string; dayOfWeekIST: number } {
  // Use current week to respect current DST state
  const now = DateTime.now().setZone(timezone);
  // Luxon weekday: 1=Mon..7=Sun. Convert our dayOfWeek (0=Sun..6=Sat) to Luxon weekday.
  const luxonWeekday = dayOfWeek === 0 ? 7 : dayOfWeek;
  // Find the date for this weekday in the current week
  const refDay = now.set({ weekday: luxonWeekday } as object);

  const [h, m] = startTime.split(":").map(Number);
  const studentDT = refDay.set({ hour: h, minute: m, second: 0, millisecond: 0 });
  const istDT = studentDT.setZone(IST_ZONE);

  return {
    time12h: formatTime12h(istDT),
    dayOfWeekIST: istDT.weekday === 7 ? 0 : istDT.weekday, // Luxon: 1=Mon..7=Sun → 0=Sun..6=Sat
  };
}

/**
 * Format the student's original time with its timezone abbreviation.
 * e.g. "4:00 PM EST" or "Sun 4:00 PM EST" (when dayOfWeek is provided)
 */
export function formatOriginalTime(startTime: string, timezone: string, dayOfWeek?: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const dt = DateTime.fromObject({ hour: h, minute: m }, { zone: timezone });
  const abbr = getTimezoneAbbr(timezone);
  const dayPrefix = dayOfWeek !== undefined ? `${DAY_NAMES_SHORT[dayOfWeek]} ` : "";
  return `${dayPrefix}${formatTime12h(dt)} ${abbr}`;
}

/**
 * Format time for display. Returns primary and secondary parts.
 *
 * Student:  primary = "4:00 PM EST",      secondary = ""
 * Staff:    primary = "2:30 AM IST",       secondary = "(Sun 4:00 PM EST)"
 */
export function formatScheduleDisplay(
  startTime: string,
  timezone: string,
  dayOfWeek: number,
  viewerRole: string
): { primary: string; secondary: string; displayDay: number } {
  if (STAFF_ROLES.includes(viewerRole.toLowerCase())) {
    const { time12h, dayOfWeekIST } = convertToIST(startTime, timezone, dayOfWeek);
    const originalWithDay = formatOriginalTime(startTime, timezone, dayOfWeek);
    return {
      primary: `${time12h} IST`,
      secondary: `(${originalWithDay})`,
      displayDay: dayOfWeekIST,
    };
  }

  // Student view: show as-is (day is shown separately by parent component)
  const originalStr = formatOriginalTime(startTime, timezone);
  return {
    primary: originalStr,
    secondary: "",
    displayDay: dayOfWeek,
  };
}

/**
 * Convert a slot's start_time from student timezone to IST and return
 * the IST hour as a decimal for calendar positioning.
 */
export function slotToISTHour(startTime: string, timezone: string, dayOfWeek: number): {
  hourDecimal: number;
  dayOfWeekIST: number;
} {
  const now = DateTime.now().setZone(timezone);
  const luxonWeekday = dayOfWeek === 0 ? 7 : dayOfWeek;
  const refDay = now.set({ weekday: luxonWeekday } as object);

  const [h, m] = startTime.split(":").map(Number);
  const studentDT = refDay.set({ hour: h, minute: m, second: 0, millisecond: 0 });
  const istDT = studentDT.setZone(IST_ZONE);

  return {
    hourDecimal: istDT.hour + istDT.minute / 60,
    dayOfWeekIST: istDT.weekday === 7 ? 0 : istDT.weekday,
  };
}

/* ──── Timezone options for dropdown ──── */

const TIMEZONE_ENTRIES = [
  { value: "America/New_York", name: "Eastern Time" },
  { value: "America/Chicago", name: "Central Time" },
  { value: "America/Denver", name: "Mountain Time" },
  { value: "America/Los_Angeles", name: "Pacific Time" },
  { value: "Asia/Kolkata", name: "India" },
];

/** Dropdown options with DST-aware abbreviation computed at render time. */
export function getTimezoneOptions(): { value: string; label: string }[] {
  return TIMEZONE_ENTRIES.map(({ value, name }) => ({
    value,
    label: `${name} (${getTimezoneAbbr(value)})`,
  }));
}

export { DAY_NAMES, DAY_NAMES_SHORT, STAFF_ROLES };
