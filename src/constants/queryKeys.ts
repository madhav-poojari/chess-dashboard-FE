// Centralized TanStack Query keys for gallery & profile features
export const queryKeys = {
    gallery: {
        images: (userId: string) => ["gallery", userId] as const,
    },
    academyGallery: {
        all: () => ["academyGallery"] as const,
        list: (page: number, pageSize: number) =>
            ["academyGallery", page, pageSize] as const,
    },
    schedule: {
        all: () => ["schedules"] as const,
        students: () => ["schedule-students"] as const,
    },
    users: {
        students: () => ["users", "students"] as const,
        coaches: () => ["users", "coaches"] as const,
    },
    attendance: {
        list: (params: { year: number; month: number; studentId?: string; coachId?: string; excludeOwn?: boolean }) =>
            ["attendances", params] as const,
    },
};
