// src/api/user/imageService.ts
import api from "../axiosInstance";
import { ApiResponse } from "./dto";

// The backend serves uploads at /uploads/* (not under /api/v1)
// We derive the base URL by stripping /api/v1 from the axios baseURL
function getUploadBaseURL(): string {
    const base = api.defaults.baseURL || "";
    return base.replace(/\/api\/v1\/?$/, "");
}

// Profile Picture

export interface ProfilePictureResponse {
    url_suffix: string;
    url: string;
}

export const uploadProfilePicture = async (
    userId: string,
    file: File
): Promise<ProfilePictureResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(`/users/${userId}/profile-picture`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    const data: ApiResponse<ProfilePictureResponse> = res.data;
    return data.data;
};

export const deleteProfilePicture = async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}/profile-picture`);
};

// Gallery

export interface GalleryImage {
    id: number;
    user_id: string;
    url_suffix: string;
    filename: string;
    title: string;
    position_in_tournament: string;
    is_private: boolean;
    created_at: string;
    url: string; // full URL returned by backend
}

export const listGalleryImages = async (
    userId: string
): Promise<GalleryImage[]> => {
    const res = await api.get(`/users/${userId}/gallery`);
    const data: ApiResponse<GalleryImage[]> = res.data;
    return data.data || [];
};

export const uploadGalleryImage = async (
    userId: string,
    file: File,
    title: string,
    positionInTournament?: string,
    isPrivate?: boolean
): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (positionInTournament) {
        formData.append("position_in_tournament", positionInTournament);
    }
    if (isPrivate) {
        formData.append("is_private", "true");
    }
    await api.post(`/users/${userId}/gallery`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const deleteGalleryImage = async (
    userId: string,
    imageId: number
): Promise<void> => {
    await api.delete(`/users/${userId}/gallery/${imageId}`);
};

export const updateGalleryImageMetadata = async (
    userId: string,
    imageId: number,
    data: {
        title?: string;
        position_in_tournament?: string;
        is_private?: boolean;
    }
): Promise<void> => {
    await api.patch(`/users/${userId}/gallery/${imageId}`, data);
};

/**
 * Build a full image URL from a url_suffix.
 * e.g. "profile-pictures/123.jpg" → "http://localhost:8080/uploads/profile-pictures/123.jpg"
 */
export const buildImageURL = (urlSuffix: string): string => {
    if (!urlSuffix) return "";
    return `${getUploadBaseURL()}/uploads/${urlSuffix}`;
};
