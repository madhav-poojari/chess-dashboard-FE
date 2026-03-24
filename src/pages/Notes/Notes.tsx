import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { useAuth, User as AuthUser } from "../../context/AuthContext";
import { Note, VisibilityLevel, canViewNote, getVisibleLevelsForRole, VISIBILITY_DESCRIPTIONS, VISIBILITY_COLORS, canManageLessonPlan } from "./types";
import NoteCard from "./NoteCard";
import CreateNoteModal from "./CreateNoteModal";
import CreateLessonPlanModal, { LessonPlan } from "./CreateLessonPlanModal";
import api from "../../api/axiosInstance";
import { deleteNote, getLessonPlanById } from "../../api/notes/noteService";
import UserProfiles from "../UserProfiles";
import TournamentList from "../../components/UserProfile/tournaments/TournamentList";

export default function Notes() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const studentIdParam = searchParams.get('studentId');
    const [activeTab, setActiveTab] = useState<"profile" | "notes" | "tournaments">("profile");

    // Edit state
    const [noteToEdit, setNoteToEdit] = useState<Note | undefined>(undefined);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState(false);

    // Detailed lesson plan data
    const [lessonPlanToEdit, setLessonPlanToEdit] = useState<LessonPlan | undefined>(undefined);
    const [rawLessonPlan, setRawLessonPlan] = useState<LessonPlan | undefined>(undefined);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const userId = studentIdParam || user?.id;
            if (!userId) {
                console.error('No user ID available for fetching notes');
                setNotes([]);
                setLoading(false);
                return;
            }
            // API_BASE already includes /api/v1
            const response = await api.get(`/notes/?user_id=${userId}`);
            const data = response.data;
            if (data.success && data.data) {
                const { notes, lesson_plan } = data.data;

                // Map the standard notes - ensure notes is an array
                const mappedNotes: Note[] = Array.isArray(notes) ? notes
                    .filter((item: { visibility: number }) => {
                        // Filter out invalid visibility levels (should be 1-4)
                        return item.visibility >= 1 && item.visibility <= 4;
                    })
                    .map((item: {
                        id: string;
                        title: string;
                        description: string;
                        visibility: number;
                        created_at: string;
                        updated_at: string;
                        user_id: string;
                        created_by_name?: string;
                        created_by?: string;
                    }) => ({
                        id: item.id,
                        title: item.title,
                        content: item.description || '',
                        visibility_level: `L${item.visibility}` as Note['visibility_level'],
                        created_at: item.created_at,
                        updated_at: item.updated_at,
                        type: 'note' as const,
                        user_id: item.user_id,
                        created_by: item.created_by_name || item.created_by
                    })) : [];

                // If there is a lesson plan, add it to the list
                if (lesson_plan && lesson_plan.active) {
                    const lpNote: Note = {
                        id: lesson_plan.id,
                        title: lesson_plan.title,
                        content: Array.isArray(lesson_plan.description) ? lesson_plan.description.join('\n') : (lesson_plan.description || ''),
                        visibility_level: 'L4', // Lesson plans are visible to student
                        created_at: lesson_plan.created_at,
                        updated_at: lesson_plan.updated_at,
                        type: 'lesson_plan',
                        user_id: lesson_plan.user_id,
                        created_by: lesson_plan.created_by_name || lesson_plan.created_by
                    };
                    // Add lesson plan to the TOP of the list
                    mappedNotes.unshift(lpNote);

                    // Store raw lesson plan for editing
                    setRawLessonPlan(lesson_plan);
                } else {
                    setRawLessonPlan(undefined);
                }

                setNotes(mappedNotes);
            } else {
                console.error('Failed to fetch notes:', data.message);
                setNotes([]);
            }
        } catch (error: unknown) {
            console.error('Error fetching notes:', error);
            // Handle different error types gracefully
            const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
            if (err.response?.status === 404 || err.response?.status === 403) {
                setNotes([]);
            } else {
                setNotes([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadNotes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, studentIdParam]);

    const userRole = user?.role || '';
    const isViewingStudent = !!studentIdParam && userRole !== 'student';

    const filteredNotes = notes
        .filter(note => {
            // Lesson plans are always visible when viewing a specific student
            if (note.type === 'lesson_plan' && studentIdParam && note.user_id === studentIdParam) {
                return true;
            }
            // Regular visibility check
            return canViewNote(note.visibility_level, userRole);
        })
        .filter(note => !studentIdParam || note.user_id === studentIdParam)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const lessonPlans = filteredNotes.filter(note => note.type === 'lesson_plan');
    const regularNotes = filteredNotes.filter(note => note.type === 'note');

    const handleEdit = async (note: Note) => {
        if (note.type === 'lesson_plan') {
            // Use the raw lesson plan data if available
            if (rawLessonPlan && rawLessonPlan.id === note.id) {
                setLessonPlanToEdit(rawLessonPlan);
                setIsLessonPlanModalOpen(true);
            } else if (note.id) {
                // Fetch the full lesson plan data
                const lessonPlan = await getLessonPlanById(note.id);
                if (lessonPlan) {
                    setLessonPlanToEdit(lessonPlan);
                    setIsLessonPlanModalOpen(true);
                } else {
                    // Fallback: construct LessonPlan from Note data
                    const fallbackLessonPlan: LessonPlan = {
                        id: note.id,
                        title: note.title,
                        description: note.content ? note.content.split('\n').filter(line => line.trim()) : [],
                        start_date: '',
                        end_date: '',
                        user_id: note.user_id || '',
                        active: true,
                        created_by: note.created_by
                    };
                    setLessonPlanToEdit(fallbackLessonPlan);
                    setIsLessonPlanModalOpen(true);
                    console.warn("Using fallback lesson plan data for edit - dates may be missing");
                }
            } else {
                console.error("Cannot edit lesson plan: missing ID");
            }
        } else {
            setNoteToEdit(note);
            setIsCreateModalOpen(true);
        }
    };

    const handleDelete = async (note: Note) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNote(note.id);
                loadNotes();
            } catch (error: unknown) {
                const err = error as { response?: { data?: { message?: string } }; message?: string };
                console.error("Failed to delete note", err.response?.data || err.message);
                alert(`Failed to delete note: ${err.response?.data?.message || err.message || 'Unknown error'}`);
            }
        }
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setNoteToEdit(undefined);
    };

    // Reset to profile tab when studentIdParam changes
    useEffect(() => {
        if (isViewingStudent) {
            setActiveTab("profile");
        }
    }, [studentIdParam, isViewingStudent]);

    // If viewing a student, show tabs
    if (isViewingStudent) {
        return (
            <>
                <PageMeta
                    title="Student Details | BRS Academy"
                    description="View student profile and notes"
                />

                <div className="mb-6">
                    <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                        Student Details
                    </h2>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 max-w-2xl">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${activeTab === "profile"
                                    ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            User Profile
                        </button>
                        <button
                            onClick={() => setActiveTab("notes")}
                            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${activeTab === "notes"
                                    ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            Notes
                        </button>
                        <button
                            onClick={() => setActiveTab("tournaments")}
                            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${activeTab === "tournaments"
                                    ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            Tournaments
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === "profile" ? (
                    <div key={studentIdParam}>
                        <UserProfiles studentId={studentIdParam} readOnly={true} galleryReadOnly={false} />
                    </div>
                ) : activeTab === "tournaments" ? (
                    <div key={`tournaments-${studentIdParam}`}>
                        <TournamentList userId={studentIdParam!} />
                    </div>
                ) : (
                    <NotesContent
                        loading={loading}
                        studentIdParam={studentIdParam}
                        user={user}
                        userRole={userRole}
                        visibleLevels={getVisibleLevelsForRole(userRole)}
                        lessonPlans={lessonPlans}
                        regularNotes={regularNotes}
                        canCreateNote={['admin', 'mentor', 'coach', 'student'].includes(userRole)}
                        canManageLessonPlan={canManageLessonPlan(userRole)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        setIsCreateModalOpen={setIsCreateModalOpen}
                        setNoteToEdit={setNoteToEdit}
                        setIsLessonPlanModalOpen={setIsLessonPlanModalOpen}
                        noteToEdit={noteToEdit}
                        isCreateModalOpen={isCreateModalOpen}
                        isLessonPlanModalOpen={isLessonPlanModalOpen}
                        lessonPlanToEdit={lessonPlanToEdit}
                        loadNotes={loadNotes}
                        handleCloseModal={handleCloseModal}
                    />
                )}
            </>
        );
    }

    // Regular notes view (for students or when not viewing a specific student)
    return (
        <>
            <PageMeta
                title="Notes | BRS Academy"
                description="View your lesson plans and notes"
            />

            <div className="mb-6">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Notes
                </h2>
            </div>

            <NotesContent
                loading={loading}
                studentIdParam={studentIdParam}
                user={user}
                userRole={userRole}
                visibleLevels={getVisibleLevelsForRole(userRole)}
                lessonPlans={lessonPlans}
                regularNotes={regularNotes}
                canCreateNote={['admin', 'mentor', 'coach', 'student'].includes(userRole)}
                canManageLessonPlan={canManageLessonPlan(userRole)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                setIsCreateModalOpen={setIsCreateModalOpen}
                setNoteToEdit={setNoteToEdit}
                setIsLessonPlanModalOpen={setIsLessonPlanModalOpen}
                noteToEdit={noteToEdit}
                isCreateModalOpen={isCreateModalOpen}
                isLessonPlanModalOpen={isLessonPlanModalOpen}
                lessonPlanToEdit={lessonPlanToEdit}
                loadNotes={loadNotes}
                handleCloseModal={handleCloseModal}
            />
        </>
    );
}

// Extract notes content into a separate component
function NotesContent({
    loading,
    studentIdParam,
    user,
    userRole,
    visibleLevels,
    lessonPlans,
    regularNotes,
    canCreateNote,
    canManageLessonPlan,
    onEdit,
    onDelete,
    setIsCreateModalOpen,
    setNoteToEdit,
    setIsLessonPlanModalOpen,
    noteToEdit,
    isCreateModalOpen,
    isLessonPlanModalOpen,
    lessonPlanToEdit,
    loadNotes,
    handleCloseModal,
}: {
    loading: boolean;
    studentIdParam: string | null;
    user: AuthUser | null;
    userRole: string;
    visibleLevels: VisibilityLevel[];
    lessonPlans: Note[];
    regularNotes: Note[];
    canCreateNote: boolean;
    canManageLessonPlan: boolean;
    onEdit: (note: Note) => void;
    onDelete: (note: Note) => void;
    setIsCreateModalOpen: (open: boolean) => void;
    setNoteToEdit: (note: Note | undefined) => void;
    setIsLessonPlanModalOpen: (open: boolean) => void;
    noteToEdit: Note | undefined;
    isCreateModalOpen: boolean;
    isLessonPlanModalOpen: boolean;
    lessonPlanToEdit: LessonPlan | undefined;
    loadNotes: () => void;
    handleCloseModal: () => void;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <>
            {/* Only show visibility legend for non-students */}
            {visibleLevels.length > 0 && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Visibility Levels</h4>
                    <div className="flex flex-wrap gap-4 text-xs">
                        {visibleLevels.map((level) => (
                            <div key={level} className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded ${VISIBILITY_COLORS[level].dot}`}></span>
                                <span className={`font-medium ${VISIBILITY_COLORS[level].text}`}>{level}</span>
                                <span className="text-gray-600 dark:text-gray-400">- {VISIBILITY_DESCRIPTIONS[level]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lesson Plans Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 mb-6">
                <div className="flex items-center justify-between mb-5 lg:mb-7">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Lesson Plans
                    </h3>
                    {canManageLessonPlan && (
                        <button
                            onClick={() => setIsLessonPlanModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
                        >
                            <svg
                                className="mr-2 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Lesson Plan
                        </button>
                    )}
                </div>
                {lessonPlans.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                        {studentIdParam ? "No lesson plans found for this student." : "No lesson plans available."}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {lessonPlans.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                userRole={userRole}
                                userId={user?.id}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex items-center justify-between mb-5 lg:mb-7">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Notes
                    </h3>
                    {canCreateNote && (
                        <button
                            onClick={() => {
                                setNoteToEdit(undefined);
                                setIsCreateModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
                        >
                            <svg
                                className="mr-2 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlSpace="preserve"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Note
                        </button>
                    )}
                </div>

                {regularNotes.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                        {studentIdParam ? "No notes found for this student." : "No notes available."}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {regularNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                userRole={userRole}
                                userId={user?.id}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CreateNoteModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                onSuccess={() => {
                    loadNotes();
                }}
                studentId={studentIdParam}
                initialData={noteToEdit}
            />

            <CreateLessonPlanModal
                isOpen={isLessonPlanModalOpen}
                onClose={() => {
                    setIsLessonPlanModalOpen(false);
                }}
                onSuccess={() => {
                    loadNotes();
                }}
                studentId={studentIdParam}
                initialData={lessonPlanToEdit}
            />
        </>
    );
}