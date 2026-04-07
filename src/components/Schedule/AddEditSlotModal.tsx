import { useState, useEffect, useRef } from "react";
import { Modal } from "../ui/modal";
import { DAY_NAMES, getTimezoneOptions } from "../../utils/timezone";
import { ClassSchedule } from "../../api/schedule/service";

interface AddEditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  editingSlot?: ClassSchedule | null;
  onSubmit: (data: { day_of_week: number; start_time: string; timezone: string }) => void;
  loading: boolean;
}

interface FormState {
  day: number;
  startTime: string;
  timezone: string;
  tzOpen: boolean;
}

const DEFAULT_FORM: FormState = {
  day: 1,
  startTime: "16:00",
  timezone: "",
  tzOpen: false,
};

export default function AddEditSlotModal({
  isOpen,
  onClose,
  studentName,
  editingSlot,
  onSubmit,
  loading,
}: AddEditSlotModalProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const tzRef = useRef<HTMLDivElement>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (editingSlot) {
      setForm({
        ...DEFAULT_FORM,
        day: editingSlot.day_of_week,
        startTime: editingSlot.start_time.slice(0, 5),
        timezone: editingSlot.timezone || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [isOpen, editingSlot]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) {
        setField("tzOpen", false);
      }
    }
    if (form.tzOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [form.tzOpen]);

  const isEditing = !!editingSlot;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.timezone) return;
    onSubmit({ day_of_week: form.day, start_time: form.startTime, timezone: form.timezone });
  };

  const INPUT_CLASS =
    "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 dark:border-gray-600 dark:text-white dark:focus:border-brand-500";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-0">
      <div className="p-5 sm:p-7">
        <h3 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
          {isEditing ? "Edit Time Slot" : "Add Time Slot"}
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          for <span className="font-medium text-gray-700 dark:text-gray-300">{studentName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Day of the week
            </label>
            <select
              value={form.day}
              onChange={(e) => setField("day", Number(e.target.value))}
              className={INPUT_CLASS}
            >
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i} className="dark:bg-gray-800">
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Class Time
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setField("startTime", e.target.value)}
              className={INPUT_CLASS}
              required
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Class duration is fixed at 1 hour
            </p>
          </div>

          {/* Timezone */}
          <div ref={tzRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Student&apos;s Timezone
            </label>
            <button
              type="button"
              onClick={() => setField("tzOpen", !form.tzOpen)}
              className={`${INPUT_CLASS} text-left flex items-center justify-between`}
            >
              <span className={!form.timezone ? "text-gray-400" : ""}>
                {form.timezone
                  ? getTimezoneOptions().find((t) => t.value === form.timezone)?.label
                  : "Select timezone"}
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${form.tzOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {form.tzOpen && (
              <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {getTimezoneOptions().map((tz) => (
                  <li
                    key={tz.value}
                    onClick={() => setForm((prev) => ({ ...prev, timezone: tz.value, tzOpen: false }))}
                    className={`cursor-pointer px-4 py-2.5 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      form.timezone === tz.value
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-medium"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {tz.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Timezone hint */}
          <div className="flex items-start gap-2 rounded-lg bg-blue-light-50 dark:bg-blue-light-500/10 border border-blue-light-200 dark:border-blue-light-500/20 px-4 py-3">
            <p className="text-xs text-blue-light-700 dark:text-blue-light-300 leading-relaxed">
              Please add the time according to the <strong>student&apos;s local timezone</strong>.
              It will be automatically converted to IST for your view.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.timezone}
              className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Saving…" : isEditing ? "Update" : "Add Slot"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}