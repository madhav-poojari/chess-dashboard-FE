export type VisibilityLevel = 'L1' | 'L2' | 'L3' | 'L4';
export type NoteType = 'lesson_plan' | 'note';

export interface Note {
    id: string;
    title: string;
    content: string;
    visibility_level: VisibilityLevel;
    created_at: string;
    updated_at?: string;
    type: NoteType;
    user_id?: string;
    created_by?: string;
}

// Visibility level descriptions
export const VISIBILITY_DESCRIPTIONS: Record<VisibilityLevel, string> = {
    L1: 'Admins only',
    L2: 'Admins & Mentors',
    L3: 'Admins, Mentors & Coaches',
    L4: 'Everyone',
};

// Role-based visibility access
const VISIBILITY_ROLES: Record<VisibilityLevel, string[]> = {
    L1: ['admin'],
    L2: ['admin', 'mentor'],
    L3: ['admin', 'mentor', 'coach'],
    L4: ['admin', 'mentor', 'coach', 'student'],
};

// Check if user can view a note based on role and visibility level
export const canViewNote = (visibilityLevel: VisibilityLevel, userRole: string): boolean => {
    return VISIBILITY_ROLES[visibilityLevel].includes(userRole);
};

// Check if user can edit/delete a note (same rules as viewing)
// Check if user can edit/delete a note (same rules as viewing)
export const canEditNote = (visibilityLevel: VisibilityLevel, userRole: string): boolean => {
    return VISIBILITY_ROLES[visibilityLevel].includes(userRole);
};

// Check if user can manage (edit/delete) lesson plans
export const canManageLessonPlan = (userRole: string): boolean => {
    return ['admin', 'mentor', 'coach'].includes(userRole);
};

// Get visibility levels that should be shown to a specific role
export const getVisibleLevelsForRole = (userRole: string): VisibilityLevel[] => {
    switch (userRole) {
        case 'admin':
            return ['L1', 'L2', 'L3', 'L4'];
        case 'mentor':
            return ['L2', 'L3', 'L4'];
        case 'coach':
            return ['L3', 'L4'];
        case 'student':
        default:
            return []; // Students don't see visibility legend
    }
};

// Color scheme for visibility levels
export const VISIBILITY_COLORS: Record<VisibilityLevel, { bg: string; border: string; text: string }> = {
    L1: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-red-500', text: 'text-red-600 dark:text-red-400' },
    L2: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-l-purple-500', text: 'text-purple-600 dark:text-purple-400' },
    L3: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    L4: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-l-green-500', text: 'text-green-600 dark:text-green-400' },
};
