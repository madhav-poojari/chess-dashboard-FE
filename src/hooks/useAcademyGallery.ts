// src/hooks/useAcademyGallery.ts
import { useQuery } from "@tanstack/react-query";
import {
    listAcademyGallery,
    AcademyGalleryResponse,
} from "../api/user/imageService";
import { queryKeys } from "../constants/queryKeys";

export function useAcademyGallery(page: number, pageSize: number = 12) {
    return useQuery<AcademyGalleryResponse>({
        queryKey: queryKeys.academyGallery.list(page, pageSize),
        queryFn: () => listAcademyGallery(page, pageSize),
    });
}
