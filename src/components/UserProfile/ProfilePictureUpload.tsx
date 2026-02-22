import { useState, useRef, useEffect } from "react";
import {
    uploadProfilePicture,
    deleteProfilePicture,
    getPresignedURL,
} from "../../api/user/imageService";

interface ProfilePictureUploadProps {
    userId: string;
    currentUrlSuffix?: string;
    readOnly?: boolean;
    onUploaded?: (urlSuffix: string) => void;
    onDeleted?: () => void;
}

export default function ProfilePictureUpload({
    userId,
    currentUrlSuffix,
    readOnly = false,
    onUploaded,
    onDeleted,
}: ProfilePictureUploadProps) {
    const [urlSuffix, setUrlSuffix] = useState(currentUrlSuffix || "");
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch presigned URL whenever urlSuffix changes
    useEffect(() => {
        if (!urlSuffix) {
            setImageUrl("");
            return;
        }
        // If it's already a full URL (e.g. after a fresh upload), use directly
        if (urlSuffix.startsWith("http")) {
            setImageUrl(urlSuffix);
            return;
        }
        let cancelled = false;
        getPresignedURL(urlSuffix).then((url) => {
            if (!cancelled) setImageUrl(url);
        });
        return () => { cancelled = true; };
    }, [urlSuffix]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!showMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setShowMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMenu]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadProfilePicture(userId, file);
            setUrlSuffix(result.url_suffix);
            setImageUrl(result.url); // Use presigned URL from response for immediate display
            onUploaded?.(result.url_suffix);
        } catch (err) {
            console.error("Failed to upload profile picture:", err);
        } finally {
            setUploading(false);
            setShowMenu(false);
            // Reset file input so same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async () => {
        setUploading(true);
        try {
            await deleteProfilePicture(userId);
            setUrlSuffix("");
            onDeleted?.();
        } catch (err) {
            console.error("Failed to delete profile picture:", err);
        } finally {
            setUploading(false);
            setShowMenu(false);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            ref={containerRef}
            className="relative w-20 h-20 group"
        >
            {/* Avatar image */}
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src="/images/user/dummy-profile-image.png"
                        alt="Default avatar"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Hover overlay (only if not read-only) */}
            {!readOnly && (
                <>
                    <button
                        type="button"
                        onClick={() => setShowMenu(!showMenu)}
                        disabled={uploading}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors cursor-pointer"
                    >
                        <svg
                            className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </button>

                    {/* Dropdown menu */}
                    {showMenu && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[120px] py-1">
                            <button
                                onClick={triggerUpload}
                                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {urlSuffix ? "Replace" : "Upload"}
                            </button>
                            {urlSuffix && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </>
            )}

            {/* Loading spinner */}
            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
