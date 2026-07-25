import { useReducer, useMemo } from "react";
import { useStudentBalances } from "../../hooks/usePayouts";
import { StudentWithBalance } from "../../api/payouts/dto";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import PayoutStudentDetailModal from "./PayoutStudentDetailModal";

interface ListState {
  search: string;
  modalOpen: boolean;
  selectedStudent: StudentWithBalance | null;
}

type ListAction =
  | { type: "SET_SEARCH"; value: string }
  | { type: "OPEN_MODAL"; student: StudentWithBalance }
  | { type: "CLOSE_MODAL" };

function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.value };
    case "OPEN_MODAL":
      return { ...state, modalOpen: true, selectedStudent: action.student };
    case "CLOSE_MODAL":
      return { ...state, modalOpen: false, selectedStudent: null };
    default:
      return state;
  }
}

function formatBalance(balance: number): string {
  // Show sign and one decimal if needed
  if (balance === 0) return "0";
  const sign = balance > 0 ? "+" : "";
  return `${sign}${Number.isInteger(balance) ? balance : balance.toFixed(2)}`;
}

export default function PayoutStudentListCard() {
  const { data: students = [], isLoading } = useStudentBalances();
  const [state, dispatch] = useReducer(listReducer, {
    search: "",
    modalOpen: false,
    selectedStudent: null,
  });

  const filtered = useMemo(() => {
    if (!state.search.trim()) return students;
    const q = state.search.toLowerCase();
    return students.filter(
      (s) =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [students, state.search]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
            Student Unit Balances
          </h3>
          <div className="w-64">
            <Input
              type="text"
              value={state.search}
              onChange={(e) =>
                dispatch({ type: "SET_SEARCH", value: e.target.value })
              }
              placeholder="Search students..."
            />
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          {isLoading ? (
            <div className="px-5 py-8 text-center text-gray-500 text-theme-sm">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500 text-theme-sm">
              {state.search ? "No students match your search" : "No students found"}
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                  >
                    Current Balance
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filtered.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-0.5">
                        {student.id}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-700 text-theme-sm dark:text-gray-300">
                        {student.email}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <span
                        className={`font-semibold text-theme-sm ${
                          student.balance > 0
                            ? "text-green-600 dark:text-green-400"
                            : student.balance < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {formatBalance(student.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          dispatch({ type: "OPEN_MODAL", student })
                        }
                      >
                        More Info
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Adjust Modal */}
      {state.selectedStudent && (
        <PayoutStudentDetailModal
          isOpen={state.modalOpen}
          onClose={() => dispatch({ type: "CLOSE_MODAL" })}
          studentId={state.selectedStudent.id}
          studentName={`${state.selectedStudent.first_name} ${state.selectedStudent.last_name}`}
          studentEmail={state.selectedStudent.email}
        />
      )}
    </>
  );
}
