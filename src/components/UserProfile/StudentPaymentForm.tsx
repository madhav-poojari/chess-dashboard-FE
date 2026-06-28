import { useReducer, useRef } from "react";
import { useSubmitPayment } from "../../hooks/usePayouts";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

interface FormState {
  file: File | null;
  fileName: string;
  transactionId: string;
  units: string;
  reason: string;
  submitting: boolean;
}

type FormAction =
  | { type: "SET_FILE"; file: File | null; name: string }
  | { type: "SET_FIELD"; field: "transactionId" | "units" | "reason"; value: string }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "RESET" };

const initialState: FormState = {
  file: null,
  fileName: "",
  transactionId: "",
  units: "",
  reason: "",
  submitting: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FILE":
      return { ...state, file: action.file, fileName: action.name };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.value };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export default function StudentPaymentForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const submitMutation = useSubmitPayment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    dispatch({ type: "SET_FILE", file, name: file?.name || "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_SUBMITTING", value: true });

    try {
      await submitMutation.mutateAsync({
        file: state.file,
        transactionId: state.transactionId,
        units: state.units ? parseFloat(state.units) : undefined,
        reason: state.reason || undefined,
      });
      dispatch({ type: "RESET" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      dispatch({ type: "SET_SUBMITTING", value: false });
    }
  };

  const isValid = state.file && state.transactionId.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Submit Payment
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload your payment screenshot and transaction ID. The admin will review and credit units to your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {/* Screenshot Upload */}
        <div>
          <Label>
            Payment Screenshot <span className="text-error-500">*</span>
          </Label>
          <div className="mt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="payment-screenshot-input"
            />
            <label
              htmlFor="payment-screenshot-input"
              className="flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 transition-colors bg-gray-50 dark:bg-white/[0.02]"
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
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to upload screenshot
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Transaction ID */}
        <div>
          <Label>
            Transaction / Reference ID <span className="text-error-500">*</span>
          </Label>
          <Input
            type="text"
            value={state.transactionId}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "transactionId", value: e.target.value })
            }
            placeholder="e.g. UPI123456789"
            required
          />
        </div>

        {/* Units (optional) */}
        <div>
          <Label>
            Units <span className="text-xs text-gray-400">(optional)</span>
          </Label>
          <Input
            type="number"
            value={state.units}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "units", value: e.target.value })
            }
            placeholder="e.g. 8"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Number of units you're paying for. Admin will confirm.
          </p>
        </div>

        {/* Reason (optional) */}
        <div>
          <Label>
            Note <span className="text-xs text-gray-400">(optional)</span>
          </Label>
          <textarea
            value={state.reason}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "reason", value: e.target.value })
            }
            placeholder="Any additional details about this payment..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!isValid || state.submitting}
        >
          {state.submitting ? "Submitting..." : "Submit Payment Request"}
        </Button>
      </form>
    </div>
  );
}
