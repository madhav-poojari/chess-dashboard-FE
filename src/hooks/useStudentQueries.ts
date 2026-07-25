import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
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

// Fetch notes summary for a single student
const fetchStudentNotesSummary = async (
  studentId: string
): Promise<StudentNotesSummary> => {
  try {
    const response = await api.get(`/notes/?user_id=${studentId}`);
    const data = response.data;
    if (!data.success || !data.data) return {};

    const { notes, lesson_plan } = data.data;

    const result: StudentNotesSummary = {};

    if (lesson_plan && lesson_plan.active) {
      result.lessonPlanTitle = lesson_plan.title;
      if (Array.isArray(lesson_plan.description)) {
        result.lessonPlanBody = lesson_plan.description.join("\n");
      } else if (lesson_plan.description) {
        result.lessonPlanBody = lesson_plan.description;
      }
    }

    if (Array.isArray(notes) && notes.length > 0) {
      const sorted = [...notes].sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      result.latestNoteTitle = sorted[0]?.title;
    }

    return result;
  } catch {
    return {};
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

export function useStudentNotesSummaryQueries(studentIds: string[]) {
  return useQueries({
    queries: studentIds.map((id) => ({
      queryKey: queryKeys.students.notesSummary(id),
      queryFn: () => fetchStudentNotesSummary(id),
      staleTime: STALE_TIME,
      refetchInterval: STALE_TIME,
      enabled: studentIds.length > 0,
    })),
  });
}

// Build a map of studentId -> notes summary from the parallel queries
export function useNotesSummaryMap(
  studentIds: string[],
  noteQueries: ReturnType<typeof useStudentNotesSummaryQueries>
) {
  return useMemo(() => {
    const map = new Map<string, StudentNotesSummary>();
    studentIds.forEach((id, index) => {
      if (noteQueries[index]?.data) {
        map.set(id, noteQueries[index].data as StudentNotesSummary);
      }
    });
    return map;
  }, [studentIds, noteQueries]);
}
