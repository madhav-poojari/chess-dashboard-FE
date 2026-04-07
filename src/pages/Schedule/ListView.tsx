import { useMemo, useState } from "react";
import { User } from "../../api/user/dto";
import { ClassSchedule } from "../../api/schedule/service";
import { useScheduleMutations } from "../../hooks/useScheduleMutations";
import SlotPill from "../../components/Schedule/SlotPill";
import AddEditSlotModal from "../../components/Schedule/AddEditSlotModal";
import { CalenderIcon } from "../../icons";

/* ────────────────── helpers ────────────────── */

type StudentGroup = { name: string; studentId: string; slots: ClassSchedule[] };

// Merge the full student roster with schedule slots so every student appears.
function buildStudentList(students: User[], slots: ClassSchedule[]): StudentGroup[] {
  const slotMap = new Map<string, ClassSchedule[]>();
  for (const s of slots) {
    if (!slotMap.has(s.student_id)) slotMap.set(s.student_id, []);
    slotMap.get(s.student_id)!.push(s);
  }

  const result: StudentGroup[] = students.map((st) => ({
    name: `${st.first_name} ${st.last_name}`,
    studentId: st.id,
    slots: slotMap.get(st.id) || [],
  }));

  for (const [sid, sSlots] of slotMap) {
    if (!students.find((st) => st.id === sid)) {
      const name = sSlots[0]?.student
        ? `${sSlots[0].student.first_name} ${sSlots[0].student.last_name}`
        : sid;
      result.push({ name, studentId: sid, slots: sSlots });
    }
  }

  return result;
}

/* ────────────────── modal state ────────────────── */

type ModalState =
  | { mode: "closed" }
  | { mode: "add"; studentId: string; studentName: string }
  | { mode: "edit"; slot: ClassSchedule; studentName: string };

/* ────────────────── component ────────────────── */

interface ListViewProps {
  slots: ClassSchedule[];
  students: User[];
  studentsLoading: boolean;
}

export default function ListView({ slots, students, studentsLoading }: ListViewProps) {
  const { createMut, updateMut, deleteMut } = useScheduleMutations();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const grouped = useMemo(() => buildStudentList(students, slots), [students, slots]);

  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <CalenderIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg">No students found</p>
        <p className="text-sm mt-1">Students will appear here once assigned.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {grouped.map(({ name, studentId, slots: sSlots }) => (
          <div
            key={studentId}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] px-4 py-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{name}</h3>
              <button
                onClick={() => setModal({ mode: "add", studentId, studentName: name })}
                className="flex items-center gap-1.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 1v12M1 7h12" strokeLinecap="round" />
                </svg>
                Add Slot
              </button>
            </div>

            {/* Existing slots */}
            <div className="flex flex-wrap gap-1.5 mb-1">
              {sSlots
                .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                .map((slot) => (
                  <SlotPill
                    key={slot.id}
                    slot={slot}
                    onEdit={() => setModal({ mode: "edit", slot, studentName: name })}
                    onDelete={() => {
                      if (confirm("Delete this time slot?")) deleteMut.mutate(slot.id);
                    }}
                  />
                ))}
            </div>

            {sSlots.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No time slots yet</p>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AddEditSlotModal
        isOpen={modal.mode !== "closed"}
        onClose={() => setModal({ mode: "closed" })}
        studentName={modal.mode !== "closed" ? modal.studentName : ""}
        editingSlot={modal.mode === "edit" ? modal.slot : null}
        onSubmit={(data) => {
          if (modal.mode === "add") {
            createMut.mutate(
              { student_id: modal.studentId, ...data },
              { onSuccess: () => setModal({ mode: "closed" }) }
            );
          } else if (modal.mode === "edit") {
            updateMut.mutate(
              { id: modal.slot.id, data },
              { onSuccess: () => setModal({ mode: "closed" }) }
            );
          }
        }}
        loading={createMut.isPending || updateMut.isPending}
      />
    </>
  );
}
