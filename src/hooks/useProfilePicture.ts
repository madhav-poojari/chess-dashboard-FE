// src/hooks/useProfilePicture.ts
import { useMutation } from "@tanstack/react-query";
import {
    uploadProfilePicture,
    deleteProfilePicture,
    ProfilePictureResponse,
} from "../api/user/imageService";

export function useUploadProfilePicture(userId: string) {
    return useMutation<ProfilePictureResponse, Error, File>({
        mutationFn: (file: File) => uploadProfilePicture(userId, file),
        onError: (error: Error) => {
            alert(`Failed to upload profile picture: ${error.message}`);
        },
    });
}

export function useDeleteProfilePicture(userId: string) {
    return useMutation<void, Error>({
        mutationFn: () => deleteProfilePicture(userId),
        onError: (error: Error) => {
            alert(`Failed to remove profile picture: ${error.message}`);
        },
    });
}
