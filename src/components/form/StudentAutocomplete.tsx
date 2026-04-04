import React, { useEffect, useRef, useState } from "react";
import { StudentSummary } from "../../api/user/dto";

type Props = {
  /** Full list of students to filter from */
  students: StudentSummary[];
  /** Currently selected student IDs */
  selectedIds: string[];
  /** Called when a student is selected */
  onSelect: (student: StudentSummary) => void;
  /** Called when a student chip is removed (multi mode) */
  onRemove: (id: string) => void;
  /** Allow multiple selections (game_session) vs single (substitution) */
  multiple: boolean;
  placeholder?: string;
};

export default function StudentAutocomplete({
  students,
  selectedIds,
  onSelect,
  onRemove,
  multiple,
  placeholder = "Search student by name...",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query.trim()
    ? students.filter((s) => {
        const full = `${s.first_name} ${s.last_name}`.toLowerCase();
        return (
          full.includes(query.toLowerCase()) &&
          !selectedIds.includes(s.id)
        );
      })
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIdx(-1);
  }, [filtered.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIdx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  const handleSelect = (student: StudentSummary) => {
    onSelect(student);
    setQuery("");
    setOpen(false);
    if (multiple) {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) {
      // Allow backspace to remove last chip
      if (e.key === "Backspace" && !query && selectedIds.length > 0 && multiple) {
        onRemove(selectedIds[selectedIds.length - 1]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filtered.length) {
        handleSelect(filtered[highlightIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectedStudents = selectedIds
    .map((id) => students.find((s) => s.id === id))
    .filter(Boolean) as StudentSummary[];

  // For single mode, show the selected name inside the input
  const singleSelected = !multiple && selectedStudents.length === 1 ? selectedStudents[0] : null;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-gray-900 focus-within:border-blue-500 dark:border-gray-600 dark:text-white dark:focus-within:border-blue-500 min-h-[42px] flex flex-wrap gap-2 items-center">
        {/* Chips for multi mode */}
        {multiple &&
          selectedStudents.map((s) => (
            <div
              key={s.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              <span>{s.first_name} {s.last_name}</span>
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${s.first_name} ${s.last_name}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

        {/* Single mode: show chip if selected, otherwise show input */}
        {!multiple && singleSelected ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            <span>{singleSelected.first_name} {singleSelected.last_name}</span>
            <button
              type="button"
              onClick={() => {
                onRemove(singleSelected.id);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${singleSelected.first_name} ${singleSelected.last_name}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          /* Hide input when single mode already has a selection */
          (multiple || !singleSelected) && (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                if (query.trim()) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-[120px] bg-transparent outline-none border-none focus:ring-0 px-1"
              placeholder={selectedIds.length === 0 ? placeholder : multiple ? "Add another student..." : placeholder}
            />
          )
        )}
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {filtered.map((s, idx) => (
            <li
              key={s.id}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                handleSelect(s);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`cursor-pointer px-4 py-2 text-sm ${
                idx === highlightIdx
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {s.first_name} {s.last_name}
              <span className="ml-2 text-xs text-gray-400">({s.id})</span>
            </li>
          ))}
        </ul>
      )}

      {/* No results hint */}
      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
          No students found
        </div>
      )}
    </div>
  );
}
