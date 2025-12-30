import { Note, VISIBILITY_COLORS, canEditNote, canManageLessonPlan } from './types';
import { PencilIcon, TrashBinIcon } from '../../icons';

interface NoteCardProps {
    note: Note;
    userRole: string;
    onEdit?: (note: Note) => void;
    onDelete?: (note: Note) => void;
    userId?: string;
}

export default function NoteCard({ note, userRole, onEdit, onDelete, userId }: NoteCardProps) {
    const colors = VISIBILITY_COLORS[note.visibility_level];
    const isLessonPlan = note.type === 'lesson_plan';
    const isStudent = userRole === 'student';

    // For regular notes: Role must allow viewing/editing except student
    // If student, they must be the owner of the note to edit/delete
    const roleAllowed = canEditNote(note.visibility_level, userRole);
    const isOwner = userId && note.user_id === userId;
    const canEditRegularNote = isStudent ? (roleAllowed && isOwner) : roleAllowed;

    // For lesson plans: Only admin, mentor, coach can edit/delete
    const canEditLessonPlanNote = canManageLessonPlan(userRole);

    // Determine if edit/delete buttons should show
    const canEdit = isLessonPlan ? canEditLessonPlanNote : canEditRegularNote;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Determine card styling based on user role and note type
    const getCardStyle = () => {
        if (isLessonPlan) {
            // Lesson plans always have neutral styling
            return 'border-l-gray-300 dark:border-l-gray-600 bg-white dark:bg-gray-800';
        }
        if (isStudent) {
            // Students see non-colored notes
            return 'border-l-gray-300 dark:border-l-gray-600 bg-white dark:bg-gray-800';
        }
        // Non-students see colored notes based on visibility level
        return `${colors.border} ${colors.bg}`;
    };

    return (
        <div
            className={`rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${getCardStyle()} p-4 transition-shadow hover:shadow-md`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">
                            {note.title}
                        </h4>
                        {/* Only show visibility badge for non-students and non-lesson plans */}
                        {!isLessonPlan && !isStudent && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.text} ${colors.bg}`}>
                                {note.visibility_level}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {note.content}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-500 space-y-0.5">
                        <div>{formatDate(note.created_at)}</div>
                        {note.created_by && (
                            <div className="text-gray-400 dark:text-gray-600">
                                Created by: {note.created_by}
                            </div>
                        )}
                    </div>
                </div>

                {canEdit && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(note)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                title="Edit note"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(note)}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Delete note"
                            >
                                <TrashBinIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
