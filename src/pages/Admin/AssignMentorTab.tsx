import { useReducer, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudentsWithAssignments,
  fetchCoachesWithAssignments,
  fetchMentorsPicker,
  setStudentMentorAssignment,
  setCoachMentorAssignment,
  StudentWithAssignment,
  CoachWithAssignment,
  PickerItem,
} from "../../api/admin/service";
import { queryKeys } from "../../constants/queryKeys";
import Button from "../../components/ui/button/Button";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Select from "../../components/form/Select";
import { MoreDotIcon } from "../../icons";

type FilterType = "students" | "coaches";

type State = {
  filter: FilterType;
  assigningId: string | null;
  selectedMentor: Record<string, string>;
  openMenuId: string | null;
  modalOpen: boolean;
  modalType: "student" | "coach";
  modalTargetId: string | null;
  modalValue: string;
};

type Action =
  | { type: "SET_FILTER"; filter: FilterType }
  | { type: "SET_ASSIGNING"; id: string | null }
  | { type: "SET_SELECTED_MENTOR"; userId: string; mentorId: string }
  | { type: "SET_MENU"; id: string | null }
  | { type: "OPEN_MODAL"; modalType: "student" | "coach"; targetId: string; value: string }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_MODAL_VALUE"; value: string };

const initialState: State = {
  filter: "students",
  assigningId: null,
  selectedMentor: {},
  openMenuId: null,
  modalOpen: false,
  modalType: "student",
  modalTargetId: null,
  modalValue: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, filter: action.filter };
    case "SET_ASSIGNING":
      return { ...state, assigningId: action.id };
    case "SET_SELECTED_MENTOR":
      return { ...state, selectedMentor: { ...state.selectedMentor, [action.userId]: action.mentorId } };
    case "SET_MENU":
      return { ...state, openMenuId: action.id };
    case "OPEN_MODAL":
      return { ...state, modalOpen: true, modalType: action.modalType, modalTargetId: action.targetId, modalValue: action.value, openMenuId: null };
    case "CLOSE_MODAL":
      return { ...state, modalOpen: false, modalTargetId: null, modalValue: "" };
    case "SET_MODAL_VALUE":
      return { ...state, modalValue: action.value };
    default:
      return state;
  }
}

export default function AssignMentorTab() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: students = [] } = useQuery<StudentWithAssignment[]>({
    queryKey: queryKeys.admin.students(),
    queryFn: fetchStudentsWithAssignments,
  });

  const { data: coaches = [] } = useQuery<CoachWithAssignment[]>({
    queryKey: queryKeys.admin.coaches(),
    queryFn: fetchCoachesWithAssignments,
  });

  const { data: mentorPicker = [] } = useQuery<PickerItem[]>({
    queryKey: queryKeys.admin.mentorsPicker(),
    queryFn: fetchMentorsPicker,
  });

  const mentorOptions = mentorPicker.map(m => ({
    value: m.id,
    label: `${m.first_name} ${m.last_name} (${m.current_student_count} assignees)`,
  }));

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.students() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.mentorsPicker() });
  };

  const studentMentorMut = useMutation({
    mutationFn: async (vars: { studentId: string; mentorId: string }) =>
      setStudentMentorAssignment(vars.studentId, vars.mentorId),
    onSuccess: invalidate,
  });

  const coachMentorMut = useMutation({
    mutationFn: async (vars: { coachId: string; mentorCoachId: string }) =>
      setCoachMentorAssignment(vars.coachId, vars.mentorCoachId),
    onSuccess: invalidate,
  });

  const handleAssign = async (userId: string) => {
    const mentorId = state.selectedMentor[userId];
    if (!mentorId) return;
    try {
      dispatch({ type: "SET_ASSIGNING", id: userId });
      if (state.filter === "students") {
        await studentMentorMut.mutateAsync({ studentId: userId, mentorId });
      } else {
        await coachMentorMut.mutateAsync({ coachId: userId, mentorCoachId: mentorId });
      }
      dispatch({ type: "SET_SELECTED_MENTOR", userId, mentorId: "" });
    } catch { alert("Failed to assign mentor"); }
    finally { dispatch({ type: "SET_ASSIGNING", id: null }); }
  };

  const handleRemove = async (id: string, isCoach: boolean) => {
    if (!confirm("Remove mentor assignment?")) return;
    try {
      if (isCoach) {
        await coachMentorMut.mutateAsync({ coachId: id, mentorCoachId: "" });
      } else {
        await studentMentorMut.mutateAsync({ studentId: id, mentorId: "" });
      }
      dispatch({ type: "SET_MENU", id: null });
    } catch { alert("Failed to remove assignment"); }
  };

  const handleSaveUpdate = async () => {
    if (!state.modalTargetId) return;
    try {
      if (state.modalType === "student") {
        await studentMentorMut.mutateAsync({ studentId: state.modalTargetId, mentorId: state.modalValue });
      } else {
        await coachMentorMut.mutateAsync({ coachId: state.modalTargetId, mentorCoachId: state.modalValue });
      }
      dispatch({ type: "CLOSE_MODAL" });
    } catch { alert("Failed to update assignment"); }
  };

  useEffect(() => {
    if (!state.openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) dispatch({ type: "SET_MENU", id: null });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [state.openMenuId]);

  const getFilterClass = (f: FilterType) =>
    state.filter === f
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  const renderRow = (item: { id: string; first_name: string; last_name: string; email: string; mentorId?: string; mentorName?: string }, isCoach: boolean) => {
    const menuId = `${isCoach ? "c" : "s"}-${item.id}`;
    return (
      <TableRow key={menuId}>
        <TableCell className="px-5 py-4 text-start">
          <div>
            <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {item.first_name} {item.last_name}
            </div>
            <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">{item.email}</div>
            {item.mentorName && (
              <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">Mentor: {item.mentorName}</div>
            )}
          </div>
        </TableCell>
        <TableCell className="px-5 py-4 text-start">
          {item.mentorId ? (
            <Badge size="sm" color="success">Assigned</Badge>
          ) : (
            <Badge size="sm" color="warning">Unassigned</Badge>
          )}
        </TableCell>
        <TableCell className="px-5 py-4 text-start">
          {!item.mentorId ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-[200px]">
                <Select
                  options={mentorOptions}
                  placeholder="Select Mentor"
                  onChange={(v) => dispatch({ type: "SET_SELECTED_MENTOR", userId: item.id, mentorId: v })}
                  className="text-theme-xs"
                />
              </div>
              <Button size="sm" variant="outline"
                onClick={() => handleAssign(item.id)}
                disabled={state.assigningId === item.id || !state.selectedMentor[item.id]}
              >
                {state.assigningId === item.id ? "Assigning..." : "Assign"}
              </Button>
            </div>
          ) : (
            <span className="text-gray-500 text-theme-xs">Mentor assigned</span>
          )}
        </TableCell>
        <TableCell className="px-5 py-4 text-start relative">
          <div className="relative" ref={state.openMenuId === menuId ? menuRef : null}>
            <button
              onClick={() => dispatch({ type: "SET_MENU", id: state.openMenuId === menuId ? null : menuId })}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <MoreDotIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            {state.openMenuId === menuId && item.mentorId && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => dispatch({ type: "OPEN_MODAL", modalType: isCoach ? "coach" : "student", targetId: item.id, value: item.mentorId || "" })}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >Update Assignment</button>
                <button
                  onClick={() => handleRemove(item.id, isCoach)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >Remove Assignment</button>
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const studentRows = students.map(s => ({
    id: s.id, first_name: s.first_name, last_name: s.last_name, email: s.email,
    mentorId: s.mentor_coach_id, mentorName: s.mentor_name,
  }));

  const coachRows = coaches.map(c => ({
    id: c.id, first_name: c.first_name, last_name: c.last_name, email: c.email,
    mentorId: c.mentor_coach_id, mentorName: c.mentor_name,
  }));

  const rows = state.filter === "students" ? studentRows : coachRows;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
            Assign Mentor — {state.filter === "students" ? "Students" : "Coaches"}
          </h3>
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            <button
              onClick={() => dispatch({ type: "SET_FILTER", filter: "students" })}
              className={`px-4 py-1.5 font-medium rounded-md text-theme-xs hover:text-gray-900 dark:hover:text-white transition-colors ${getFilterClass("students")}`}
            >Students</button>
            <button
              onClick={() => dispatch({ type: "SET_FILTER", filter: "coaches" })}
              className={`px-4 py-1.5 font-medium rounded-md text-theme-xs hover:text-gray-900 dark:hover:text-white transition-colors ${getFilterClass("coaches")}`}
            >Coaches</button>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Action</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-12"> </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5 py-8 text-center text-gray-500 text-theme-sm">
                    No {state.filter} found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => renderRow(row, state.filter === "coaches"))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Update Modal */}
      {state.modalOpen && state.modalTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Update Mentor Assignment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Mentor</label>
                <Select
                  options={[{ value: "", label: "None (Remove Assignment)" }, ...mentorOptions]}
                  placeholder="Select Mentor"
                  onChange={(v) => dispatch({ type: "SET_MODAL_VALUE", value: v })}
                  className="text-theme-xs"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => dispatch({ type: "CLOSE_MODAL" })}>Cancel</Button>
              <Button onClick={handleSaveUpdate}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
