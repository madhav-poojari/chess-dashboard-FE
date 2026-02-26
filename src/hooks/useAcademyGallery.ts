// src/hooks/useAcademyGallery.ts
import { useQuery } from "@tanstack/react-query";
import {
    listAcademyGallery,
    AcademyGalleryResponse,
} from "../api/user/imageService";

export function useAcademyGallery(page: number, pageSize: number = 12) {
    return useQuery<AcademyGalleryResponse>({
        queryKey: ["academyGallery", page, pageSize],
        queryFn: () => listAcademyGallery(page, pageSize),
    });
}
