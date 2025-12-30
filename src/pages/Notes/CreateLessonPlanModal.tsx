import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { useAuth } from '../../context/AuthContext';
import { fetchStudents } from '../../api/user/service';
import { User } from '../../api/user/dto';
import api from '../../api/axiosInstance';

interface LessonPlan {
    id?: string;
    title: string;
    description: string[];
    start_date: string;
    end_date: string;
    user_id: string;
    active?: boolean;
    created_by?: string;
}

interface CreateLessonPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentId?: string | null;
    initialData?: LessonPlan;
}

export default function CreateLessonPlanModal({ isOpen, onClose, onSuccess, studentId, initialData }: CreateLessonPlanModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
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
                setDescription(initialData.description.join('\n'));
                setStartDate(initialData.start_date?.split('T')[0] || '');
                setEndDate(initialData.end_date?.split('T')[0] || '');
                setSelectedStudentId(initialData.user_id || '');
            } else {
                // Create mode
                setTitle('');
                setDescription('');
                setStartDate('');
                setEndDate('');
                if (studentId) {
                    setSelectedStudentId(studentId);
                } else {
                    setSelectedStudentId('');
                }
            }
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

        if (!startDate || !endDate) {
            setError('Please provide both start and end dates.');
            setLoading(false);
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            setError('End date must be after start date.');
            setLoading(false);
            return;
        }

        try {
            // Convert dates to RFC3339 format as required by backend
            const startDateRFC3339 = new Date(startDate).toISOString();
            const endDateRFC3339 = new Date(endDate).toISOString();

            const payload = {
                user_id: targetStudentId,
                title,
                description: description.split('\n').filter(line => line.trim()),
                start_date: startDateRFC3339,
                end_date: endDateRFC3339,
            };

            if (initialData?.id) {
                // Update existing lesson plan
                await api.put(`/api/v1/notes/lesson-plans/${initialData.id}`, payload);
            } else {
                // Create new lesson plan
                await api.post('/api/v1/notes/lesson-plans', payload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Save lesson plan error:", err);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save lesson plan';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const isEditMode = !!initialData;
    const canManage = ['admin', 'mentor', 'coach'].includes(user?.role || '');

    if (!canManage) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 max-w-lg">
                {/* Header with blue accent */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isEditMode ? 'Edit Lesson Plan' : 'Create Lesson Plan'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isEditMode ? 'Update the lesson plan details' : 'Set up a structured learning path for your student'}
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Student Selector */}
                    {(!studentId || isEditMode) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Student <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                                required
                                disabled={isEditMode}
                            >
                                <option value="" disabled>Select a student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.first_name} {student.last_name} ({student.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Lesson Plan Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                            placeholder="e.g., Opening Fundamentals - Phase 1"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Description / Goals */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Goals & Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors resize-none"
                            placeholder="Enter each goal on a new line:&#10;• Master basic opening principles&#10;• Understand pawn structures&#10;• Practice 3 games per week"
                        />
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            Each line will be treated as a separate goal or milestone
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                isEditMode ? 'Update Lesson Plan' : 'Create Lesson Plan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
