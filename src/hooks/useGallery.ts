// src/hooks/useGallery.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    listGalleryImages,
    uploadGalleryImage,
    deleteGalleryImage,
    updateGalleryImageMetadata,
    GalleryImage,
} from "../api/user/imageService";

export function useGalleryImages(userId: string) {
    return useQuery<GalleryImage[]>({
        queryKey: ["gallery", userId],
        queryFn: () => listGalleryImages(userId),
        enabled: !!userId,
    });
}

export function useUploadGalleryImage(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: {
            file: File;
            title: string;
            tags?: string[];
            isPrivate?: boolean;
        }) =>
            uploadGalleryImage(
                userId,
                params.file,
                params.title,
                params.tags,
                params.isPrivate
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gallery", userId] });
            queryClient.invalidateQueries({ queryKey: ["academyGallery"] });
        },
    });
}

export function useDeleteGalleryImage(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (imageId: number) => deleteGalleryImage(userId, imageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gallery", userId] });
            queryClient.invalidateQueries({ queryKey: ["academyGallery"] });
        },
    });
}

export function useUpdateGalleryImageMetadata(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: {
            imageId: number;
            data: {
                title?: string;
                tags?: string[];
                is_private?: boolean;
            };
        }) => updateGalleryImageMetadata(userId, params.imageId, params.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gallery", userId] });
            queryClient.invalidateQueries({ queryKey: ["academyGallery"] });
        },
    });
}
