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
 * Fetch a presigned URL from the backend for a given R2 object key.
 * Use this for profile pictures and any url_suffix stored in the DB.
 */
export const getPresignedURL = async (key: string): Promise<string> => {
    if (!key) return "";
    // If it's already a full URL (e.g. from an upload response), return as-is
    if (key.startsWith("http")) return key;
    const res = await api.get(`/images/presign`, { params: { key } });
    const data: ApiResponse<{ url: string }> = res.data;
    return data.data?.url || "";
};

/**
 * Build a full image URL from a url_suffix.
 * For R2 presigned URLs (starting with http), returns as-is.
 * For legacy local suffixes, constructs the local path.
 */
export const buildImageURL = (urlSuffix: string): string => {
    if (!urlSuffix) return "";
    // R2 presigned URLs are already full URLs
    if (urlSuffix.startsWith("http")) return urlSuffix;
    return `${getUploadBaseURL()}/uploads/${urlSuffix}`;
};
