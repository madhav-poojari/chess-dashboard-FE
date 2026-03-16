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
};
