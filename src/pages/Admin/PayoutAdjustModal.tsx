import { useReducer } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { useAdminAdjust } from "../../hooks/usePayouts";
import { TransactionType } from "../../api/payouts/dto";

interface PayoutAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

interface FormState {
  direction: "add" | "deduct";
  units: string;
  reason: string;
  type: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: string }
  | { type: "RESET" };

const initialState: FormState = {
  direction: "add",
  units: "",
  reason: "",
  type: TransactionType.ADMIN_CREDIT,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const ADD_TYPE_OPTIONS = [
  { value: TransactionType.ADMIN_CREDIT, label: "Admin Credit" },
  { value: TransactionType.REFERRAL_BONUS, label: "Referral Bonus" },
];

const DEDUCT_TYPE_OPTIONS = [
  { value: TransactionType.ADMIN_DEBIT, label: "Admin Debit" },
];

export default function PayoutAdjustModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: PayoutAdjustModalProps) {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const adjustMutation = useAdminAdjust();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const unitsNum = parseFloat(state.units);
    if (isNaN(unitsNum) || unitsNum <= 0) return;

    await adjustMutation.mutateAsync({
      user_id: studentId,
      units: unitsNum,
      reason: state.reason,
      type: state.type as TransactionType,
    });

    dispatch({ type: "RESET" });
    onClose();
  };

  const handleDirectionChange = (dir: string) => {
    dispatch({ type: "SET_FIELD", field: "direction", value: dir });
    // Reset type when switching direction
    if (dir === "add") {
      dispatch({ type: "SET_FIELD", field: "type", value: TransactionType.ADMIN_CREDIT });
    } else {
      dispatch({ type: "SET_FIELD", field: "type", value: TransactionType.ADMIN_DEBIT });
    }
  };

  const typeOptions = state.direction === "add" ? ADD_TYPE_OPTIONS : DEDUCT_TYPE_OPTIONS;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 mx-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
        Adjust Units
      </h3>
      <p className="text-gray-500 text-theme-sm dark:text-gray-400 mb-5">
        For <span className="font-medium text-gray-700 dark:text-white/80">{studentName}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Direction toggle */}
        <div>
          <Label>Direction</Label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleDirectionChange("add")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.direction === "add"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-1 ring-green-300 dark:ring-green-700"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              + Add Units
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange("deduct")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.direction === "deduct"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-700"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              − Deduct Units
            </button>
          </div>
        </div>

        {/* Type */}
        <div>
          <Label>Type</Label>
          <Select
            options={typeOptions}
            onChange={(val) => dispatch({ type: "SET_FIELD", field: "type", value: val })}
            placeholder="Select type"
          />
        </div>

        {/* Units */}
        <div>
          <Label>
            Units <span className="text-error-500">*</span>
            <span className="text-xs text-gray-400 ml-1">(max 3)</span>
          </Label>
          <Input
            type="number"
            name="units"
            value={state.units}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "units", value: e.target.value })
            }
            placeholder="e.g. 1.5"
            required
          />
        </div>

        {/* Reason */}
        <div>
          <Label>Reason <span className="text-error-500">*</span></Label>
          <textarea
            value={state.reason}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "reason", value: e.target.value })
            }
            placeholder="e.g. Referral bonus for bringing new student"
            rows={2}
            required
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              dispatch({ type: "RESET" });
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={adjustMutation.isPending}>
            {adjustMutation.isPending
              ? "Processing..."
              : state.direction === "add"
                ? "Add Units"
                : "Deduct Units"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
