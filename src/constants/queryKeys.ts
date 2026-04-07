// Centralized TanStack Query keys for gallery, profile & schedule features
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
        byStudent: (studentId: string) => ["student-schedule", studentId] as const,
    },
};
