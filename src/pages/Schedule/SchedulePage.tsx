import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import { fetchStudents } from "../../api/user/service";
import { User } from "../../api/user/dto";
import { listSchedules, ClassSchedule } from "../../api/schedule/service";
import { queryKeys } from "../../constants/queryKeys";
import ListView from "./ListView";
import CalendarView from "./CalendarView";
import { CalenderIcon, ListIcon } from "../../icons";

export default function SchedulePage() {
  const [view, setView] = useState<"list" | "calendar">("list");

  const { data: schedules = [], isLoading } = useQuery<ClassSchedule[]>({
    queryKey: queryKeys.schedule.all(),
    queryFn: listSchedules,
    staleTime: 2 * 60 * 1000,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: queryKeys.schedule.students(),
    queryFn: fetchStudents,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <PageMeta title="Schedule | BRS Chess Dashboard" description="Manage class schedules for students" />
      <PageBreadcrumb pageTitle="Schedule" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Class Schedule</h3>

          <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === "list"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <ListIcon className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === "calendar"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <CalenderIcon className="w-4 h-4" />
              Calendar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : view === "list" ? (
          <ListView slots={schedules} students={students} studentsLoading={studentsLoading} />
        ) : (
          <CalendarView slots={schedules} />
        )}
      </div>
    </>
  );
}
