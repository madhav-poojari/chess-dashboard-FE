import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { useAuth } from '../../context/AuthContext';
import { VISIBILITY_DESCRIPTIONS, VisibilityLevel, NoteType, Note } from './types';
import { createNote, updateNote } from '../../api/notes/noteService';
import { fetchStudents } from '../../api/user/service';
import { User } from '../../api/user/dto';

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentId?: string | null;
    initialData?: Note;
}

export default function CreateNoteModal({ isOpen, onClose, onSuccess, studentId, initialData }: CreateNoteModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<NoteType>('note');
    const [visibility, setVisibility] = useState<VisibilityLevel>('L3');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Student selection logic
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setError('');
            if (initialData) {
                // Edit mode
                setTitle(initialData.title);
                setContent(initialData.content);
                setType(initialData.type);
                setVisibility(initialData.visibility_level);
                // For editing, we might not allow changing the student, but let's pre-fill it
                setSelectedStudentId(initialData.user_id || '');
            } else {
                // Create mode
                setTitle('');
                setContent('');
                setType('note');
                setVisibility('L3');
                // If studentId prop is provided, use it
                if (studentId) {
                    setSelectedStudentId(studentId);
                } else {
                    setSelectedStudentId('');
                }
            }
            // Always load students if regex not provided (or even if provided, to show name)
            loadStudents();
        }
    }, [isOpen, studentId, initialData]);

    const loadStudents = async () => {
        try {
            const data = await fetchStudents();
            setStudents(data);
        } catch (err) {
            console.error("Failed to fetch students", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const targetStudentId = initialData?.user_id || studentId || selectedStudentId;

        if (!targetStudentId) {
            setError('Please select a student.');
            setLoading(false);
            return;
        }

        try {
            if (initialData) {
                await updateNote(initialData.id, {
                    title,
                    content,
                    visibility_level: visibility,
                    type,
                    studentId: targetStudentId
                });
            } else {
                await createNote({
                    title,
                    content,
                    visibility_level: visibility,
                    type,
                    studentId: targetStudentId
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Save note error:", err);
            const errorMessage = err.response?.data?.error || err.message || 'Failed to save note';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const isOptionDisabled = (level: VisibilityLevel) => {
        const role = user?.role || '';
        if (role === 'admin') return false;
        if (role === 'mentor' && level === 'L1') return true;
        if (role === 'coach' && (level === 'L1' || level === 'L2')) return true;
        return false;
    };

    const isEditMode = !!initialData;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-4 sm:p-6">
                <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">
                    {isEditMode ? 'Edit' : 'Add'} {type === 'lesson_plan' ? 'Lesson Plan' : 'Note'}
                </h3>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Note Type Selector */}
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                checked={type === 'note'}
                                onChange={() => setType('note')}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Note</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                checked={type === 'lesson_plan'}
                                onChange={() => setType('lesson_plan')}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Lesson Plan</span>
                        </label>
                    </div>

                    {/* Student Selector (only if not pre-selected via URL and NOT in edit mode - usually we don't change student on edit) */}
                    {/* If editing, show disabled input or just hidden if we want to lock it */}
                    {(!studentId || isEditMode) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Student
                            </label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                required
                                disabled={isEditMode}
                            >
                                <option value="" disabled>Select a student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id} className="dark:bg-gray-800">
                                        {student.first_name} {student.last_name} ({student.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
                            placeholder="Enter title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Visibility Level
                        </label>
                        <select
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
                        >
                            {(Object.keys(VISIBILITY_DESCRIPTIONS) as VisibilityLevel[]).map((level) => (
                                <option
                                    key={level}
                                    value={level}
                                    disabled={isOptionDisabled(level)}
                                    className="dark:bg-gray-800"
                                >
                                    {level} - {VISIBILITY_DESCRIPTIONS[level]}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Who can see this?
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Content
                        </label>
                        <textarea
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
                            placeholder="Write your note content here..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Note' : 'Save Note')}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
