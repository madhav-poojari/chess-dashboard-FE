import api from "../axiosInstance";
import { Note } from "../../pages/Notes/types";
import { LessonPlan } from "../../pages/Notes/CreateLessonPlanModal";

export interface CreateNotePayload {
    title: string;
    content: string;
    visibility_level: string;
    type: string;
    studentId?: string;
}

export interface CreateLessonPlanPayload {
    user_id: string;
    title: string;
    description: string[];
    start_date: string;
    end_date: string;
}

// Helper to map visibility level to integer
const mapVisibilityToInt = (level: string): number => {
    switch (level) {
        case 'L1': return 1;
        case 'L2': return 2;
        case 'L3': return 3;
        case 'L4': return 4;
        default: return 4;
    }
};

export const createNote = async (note: CreateNotePayload): Promise<Note> => {
    // Map to backend expected payload
    const payload = {
        user_id: note.studentId, // Backend expects target user_id here
        title: note.title,
        description: note.content,
        primary_tag: note.type === 'lesson_plan' ? 'Lesson Plan' : 'General', // Map type to tag
        tags: [],
        visibility: mapVisibilityToInt(note.visibility_level),
        additional_info: {
            created_type: note.type // Store original type if needed
        }
    };

    const response = await api.post("/api/v1/notes", payload);
    return response.data.data;
};

export const updateNote = async (id: string, note: CreateNotePayload): Promise<Note> => {
    const payload = {
        user_id: note.studentId,
        title: note.title,
        description: note.content,
        primary_tag: note.type === 'lesson_plan' ? 'Lesson Plan' : 'General',
        visibility: mapVisibilityToInt(note.visibility_level),
        additional_info: {
            created_type: note.type
        }
    };
    const response = await api.post(`/api/v1/notes/${id}`, payload);
    return response.data.data;
};

export const deleteNote = async (id: string): Promise<void> => {
    await api.delete(`/api/v1/notes/${id}`);
};

// Lesson Plan service functions
export const createLessonPlan = async (lessonPlan: CreateLessonPlanPayload): Promise<LessonPlan> => {
    const response = await api.post("/api/v1/notes/lesson-plans", lessonPlan);
    return response.data.data;
};

export const updateLessonPlan = async (id: string, lessonPlan: CreateLessonPlanPayload): Promise<LessonPlan> => {
    const response = await api.patch(`/api/v1/notes/lesson-plans/${id}`, lessonPlan);
    return response.data.data;
};

export const getLessonPlanById = async (id: string): Promise<LessonPlan | null> => {
    try {
        const response = await api.get(`/api/v1/notes/lesson-plans/${id}`);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch lesson plan:", error);
        return null;
    }
};
