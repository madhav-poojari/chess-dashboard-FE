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
    },
    ratings: {
        byPlatform: (studentId: string, platform: string) =>
            ["student-ratings", studentId, platform] as const,
    },
    users: {
        students: () => ["users", "students"] as const,
        coaches: () => ["users", "coaches"] as const,
    },
    attendance: {
        list: (params: { year: number; month: number; studentId?: string; coachId?: string; excludeOwn?: boolean }) =>
            ["attendances", params] as const,
    },
    admin: {
        unapprovedUsers: () => ["admin", "unapproved-users"] as const,
        students: () => ["admin", "students"] as const,
        coaches: () => ["admin", "coaches"] as const,
        coachesPicker: () => ["admin", "coaches-picker"] as const,
        mentorsPicker: () => ["admin", "mentors-picker"] as const,
        allUsers: () => ["admin", "all-users"] as const,
        adminAttendance: (year: number, month: number) =>
            ["admin", "attendance", year, month] as const,
    },
    payouts: {
        pending: () => ["payouts", "pending"] as const,
        balances: () => ["payouts", "balances"] as const,
        timeline: (userId: string) => ["payouts", "timeline", userId] as const,
    },
    students: {
        list: () => ["students"] as const,
        adminAssignments: () => ["admin-students-assignments"] as const,
        bulkNotesSummary: () => ["bulk-notes-summary"] as const,
    },
    notifications: {
        list: () => ["notifications"] as const,
        unreadCount: () => ["notifications", "unread-count"] as const,
    },
    blogs: {
        list: (page: number, pageSize: number) =>
            ["blogs", "list", page, pageSize] as const,
        detail: (slug: string) => ["blogs", "detail", slug] as const,
        myDrafts: () => ["blogs", "my-drafts"] as const,
        tags: () => ["blogs", "tags"] as const,
        images: (blogId: string) => ["blogs", "images", blogId] as const,
    },
};

