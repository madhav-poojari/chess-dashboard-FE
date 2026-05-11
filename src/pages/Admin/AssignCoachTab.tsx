import { useReducer, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudentsWithAssignments,
  fetchCoachesPicker,
  setStudentCoachAssignment,
  StudentWithAssignment,
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

type State = {
  assigningId: string | null;
  selectedCoach: Record<string, string>;
  openMenuId: string | null;
  modalOpen: boolean;
  modalTargetId: string | null;
  modalValue: string;
};

type Action =
  | { type: "SET_ASSIGNING"; id: string | null }
  | { type: "SET_SELECTED_COACH"; studentId: string; coachId: string }
  | { type: "SET_MENU"; id: string | null }
  | { type: "OPEN_MODAL"; targetId: string; value: string }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_MODAL_VALUE"; value: string };

const initialState: State = {
  assigningId: null,
  selectedCoach: {},
  openMenuId: null,
  modalOpen: false,
  modalTargetId: null,
  modalValue: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ASSIGNING":
      return { ...state, assigningId: action.id };
    case "SET_SELECTED_COACH":
      return { ...state, selectedCoach: { ...state.selectedCoach, [action.studentId]: action.coachId } };
    case "SET_MENU":
      return { ...state, openMenuId: action.id };
    case "OPEN_MODAL":
      return { ...state, modalOpen: true, modalTargetId: action.targetId, modalValue: action.value, openMenuId: null };
    case "CLOSE_MODAL":
      return { ...state, modalOpen: false, modalTargetId: null, modalValue: "" };
    case "SET_MODAL_VALUE":
      return { ...state, modalValue: action.value };
    default:
      return state;
  }
}

export default function AssignCoachTab() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: students = [] } = useQuery<StudentWithAssignment[]>({
    queryKey: queryKeys.admin.students(),
    queryFn: fetchStudentsWithAssignments,
  });

  const { data: coachPicker = [] } = useQuery<PickerItem[]>({
    queryKey: queryKeys.admin.coachesPicker(),
    queryFn: fetchCoachesPicker,
  });

  const coachOptions = coachPicker.map(c => ({
    value: c.id,
    label: `${c.first_name} ${c.last_name} (${c.current_student_count} students)`,
  }));

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.students() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.coachesPicker() });
  };

  const mutation = useMutation({
    mutationFn: async (vars: { studentId: string; coachId: string }) =>
      setStudentCoachAssignment(vars.studentId, vars.coachId),
    onSuccess: invalidate,
  });

  useEffect(() => {
    if (!state.openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) dispatch({ type: "SET_MENU", id: null });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [state.openMenuId]);

  const handleAssign = async (studentId: string) => {
    const coachId = state.selectedCoach[studentId];
    if (!coachId) return;
    try {
      dispatch({ type: "SET_ASSIGNING", id: studentId });
      await mutation.mutateAsync({ studentId, coachId });
      dispatch({ type: "SET_SELECTED_COACH", studentId, coachId: "" });
    } catch { alert("Failed to assign coach"); }
    finally { dispatch({ type: "SET_ASSIGNING", id: null }); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove coach assignment?")) return;
    try {
      await mutation.mutateAsync({ studentId: id, coachId: "" });
      dispatch({ type: "SET_MENU", id: null });
    } catch { alert("Failed to remove assignment"); }
  };

  const handleSaveUpdate = async () => {
    if (!state.modalTargetId) return;
    try {
      await mutation.mutateAsync({ studentId: state.modalTargetId, coachId: state.modalValue });
      dispatch({ type: "CLOSE_MODAL" });
    } catch { alert("Failed to update assignment"); }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4">
          <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">Students</h3>
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
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5 py-8 text-center text-gray-500 text-theme-sm">No students found</TableCell>
                </TableRow>
              ) : (
                students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">{student.email}</div>
                        {student.coach_name && (
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">Coach: {student.coach_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      {student.coach_id ? (
                        <Badge size="sm" color="success">Assigned</Badge>
                      ) : (
                        <Badge size="sm" color="warning">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      {!student.coach_id ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-[200px]">
                            <Select
                              options={coachOptions}
                              placeholder="Select Coach"
                              onChange={(v) => dispatch({ type: "SET_SELECTED_COACH", studentId: student.id, coachId: v })}
                              className="text-theme-xs"
                            />
                          </div>
                          <Button size="sm" variant="outline"
                            onClick={() => handleAssign(student.id)}
                            disabled={state.assigningId === student.id || !state.selectedCoach[student.id]}
                          >
                            {state.assigningId === student.id ? "Assigning..." : "Assign"}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-theme-xs">Assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start relative">
                      <div className="relative" ref={state.openMenuId === student.id ? menuRef : null}>
                        <button
                          onClick={() => dispatch({ type: "SET_MENU", id: state.openMenuId === student.id ? null : student.id })}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <MoreDotIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        {state.openMenuId === student.id && student.coach_id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => dispatch({ type: "OPEN_MODAL", targetId: student.id, value: student.coach_id || "" })}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >Update Assignment</button>
                            <button
                              onClick={() => handleRemove(student.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >Remove Assignment</button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Update Modal */}
      {state.modalOpen && state.modalTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Update Coach Assignment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Coach</label>
                <Select
                  options={[{ value: "", label: "None (Remove Assignment)" }, ...coachOptions]}
                  placeholder="Select Coach"
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
