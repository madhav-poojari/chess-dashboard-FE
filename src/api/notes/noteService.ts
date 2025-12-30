import api from "../axiosInstance";
import { Note } from "../../pages/Notes/types";

export interface CreateNotePayload {
    title: string;
    content: string;
    visibility_level: string;
    type: string;
    studentId?: string;
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
    // Note: If backend response differs from frontend Note type, might need mapping here too.
    // For now assuming we just need the creation to succeed.
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
