// src/api/user/imageService.ts
import api from "../axiosInstance";
import { ApiResponse } from "./dto";

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
    tags: string[];
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
    tags?: string[],
    isPrivate?: boolean
): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (tags && tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
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
        tags?: string[];
        is_private?: boolean;
    }
): Promise<void> => {
    await api.patch(`/users/${userId}/gallery/${imageId}`, data);
};



// Academy Gallery

export interface AcademyGalleryImage extends GalleryImage {
    user_first_name: string;
    user_last_name: string;
}

export interface AcademyGalleryResponse {
    images: AcademyGalleryImage[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
}

export const listAcademyGallery = async (
    page: number = 1,
    pageSize: number = 12
): Promise<AcademyGalleryResponse> => {
    const res = await api.get(`/images/academy-gallery`, {
        params: { page, page_size: pageSize },
    });
    const data: ApiResponse<AcademyGalleryResponse> = res.data;
    return data.data;
};
