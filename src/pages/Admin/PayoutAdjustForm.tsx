import { useReducer, useRef } from "react";
import { useAdminAdjust } from "../../hooks/usePayouts";
import { TransactionType } from "../../api/payouts/dto";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";

interface PayoutAdjustFormProps {
  studentId: string;
  onSuccess?: () => void;
}

interface FormState {
  direction: "add" | "deduct";
  units: string;
  reason: string;
  type: string;
  file: File | null;
  fileName: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: string }
  | { type: "SET_FILE"; file: File | null; name: string }
  | { type: "RESET" };

const initialState: FormState = {
  direction: "add",
  units: "",
  reason: "",
  type: TransactionType.ADMIN_CREDIT,
  file: null,
  fileName: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_FILE":
      return { ...state, file: action.file, fileName: action.name };
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

export default function PayoutAdjustForm({
  studentId,
  onSuccess,
}: PayoutAdjustFormProps) {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const adjustMutation = useAdminAdjust();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const unitsNum = parseFloat(state.units);
    if (isNaN(unitsNum) || unitsNum <= 0) return;

    await adjustMutation.mutateAsync({
      user_id: studentId,
      units: unitsNum,
      reason: state.reason,
      type: state.type as TransactionType,
      screenshot: state.file,
    });

    dispatch({ type: "RESET" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    onSuccess?.();
  };

  const handleDirectionChange = (dir: string) => {
    dispatch({ type: "SET_FIELD", field: "direction", value: dir });
    if (dir === "add") {
      dispatch({ type: "SET_FIELD", field: "type", value: TransactionType.ADMIN_CREDIT });
    } else {
      dispatch({ type: "SET_FIELD", field: "type", value: TransactionType.ADMIN_DEBIT });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    dispatch({ type: "SET_FILE", file, name: file?.name || "" });
  };

  const typeOptions = state.direction === "add" ? ADD_TYPE_OPTIONS : DEDUCT_TYPE_OPTIONS;

  return (
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

      {/* Screenshot upload */}
      <div>
        <Label>
          Screenshot <span className="text-xs text-gray-400">(optional)</span>
        </Label>
        <div className="mt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="adjust-screenshot-input"
          />
          <label
            htmlFor="adjust-screenshot-input"
            className="flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 transition-colors bg-gray-50 dark:bg-white/[0.02]"
          >
            {state.fileName ? (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {state.fileName}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch({ type: "SET_FILE", file: null, name: "" });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-gray-400 hover:text-red-500 ml-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click to attach screenshot (PNG, JPG up to 5MB)
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={adjustMutation.isPending}>
          {adjustMutation.isPending
            ? "Processing..."
            : state.direction === "add"
              ? "Add Units"
              : "Deduct Units"}
        </Button>
      </div>
    </form>
  );
}
