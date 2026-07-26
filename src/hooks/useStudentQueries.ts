import { useQuery } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import { fetchStudents } from "../api/user/service";
import { fetchStudentsWithAssignments } from "../api/admin/service";
import { queryKeys } from "../constants/queryKeys";
import { StudentWithRelations } from "../api/user/dto";
import { StudentWithAssignment } from "../api/admin/service";

// Lightweight note/lesson-plan summary per student
export interface StudentNotesSummary {
  lessonPlanTitle?: string;
  lessonPlanBody?: string;
  latestNoteTitle?: string;
}

// Backend response shape: map of studentId -> summary
interface BulkSummaryBackendEntry {
  lesson_plan_title?: string;
  lesson_plan_description?: string[];
  latest_note_title?: string;
}

// Fetch notes + lesson plan summaries for all students in one call
const fetchBulkNotesSummary = async (): Promise<
  Map<string, StudentNotesSummary>
> => {
  try {
    const response = await api.get("/notes/bulk-summary");
    const data = response.data;
    if (!data.success || !data.data) return new Map();

    const raw: Record<string, BulkSummaryBackendEntry> = data.data;
    const map = new Map<string, StudentNotesSummary>();

    for (const [studentId, entry] of Object.entries(raw)) {
      const summary: StudentNotesSummary = {};
      if (entry.lesson_plan_title) {
        summary.lessonPlanTitle = entry.lesson_plan_title;
        if (
          Array.isArray(entry.lesson_plan_description) &&
          entry.lesson_plan_description.length > 0
        ) {
          summary.lessonPlanBody = entry.lesson_plan_description.join("\n");
        }
      }
      if (entry.latest_note_title) {
        summary.latestNoteTitle = entry.latest_note_title;
      }
      map.set(studentId, summary);
    }

    return map;
  } catch {
    return new Map();
  }
};

const STALE_TIME = 5 * 60 * 1000;

export function useStudentsQuery(enabled: boolean) {
  return useQuery<StudentWithRelations[]>({
    queryKey: queryKeys.students.list(),
    queryFn: fetchStudents,
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: STALE_TIME,
  });
}

export function useAdminStudentsQuery(enabled: boolean) {
  return useQuery<StudentWithAssignment[]>({
    queryKey: queryKeys.students.adminAssignments(),
    queryFn: fetchStudentsWithAssignments,
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: STALE_TIME,
  });
}

// Single query that returns a Map<studentId, summary> for all students
export function useBulkNotesSummaryQuery() {
  return useQuery<Map<string, StudentNotesSummary>>({
    queryKey: queryKeys.students.bulkNotesSummary(),
    queryFn: fetchBulkNotesSummary,
    staleTime: STALE_TIME,
    refetchInterval: STALE_TIME,
  });
}
