import { useState, useRef } from "react";
import { GalleryImage } from "../../api/user/imageService";
import {
    useGalleryImages,
    useUploadGalleryImage,
    useUpdateGalleryImageMetadata,
    useDeleteGalleryImage,
} from "../../hooks/useGallery";
import { useAuth } from "../../context/AuthContext";
import GalleryGrid from "./gallery/GalleryGrid";
import GalleryUploadModal from "./gallery/GalleryUploadModal";
import GalleryEditModal from "./gallery/GalleryEditModal";
import ImageLightbox from "./gallery/ImageLightbox";

interface StudentGalleryProps {
    userId: string;
    readOnly?: boolean;
}

export default function StudentGallery({
    userId,
    readOnly = false,
}: StudentGalleryProps) {
    const { user } = useAuth();
    const { data: images = [], isLoading } = useGalleryImages(userId);
    const uploadMutation = useUploadGalleryImage(userId);
    const updateMutation = useUpdateGalleryImageMetadata(userId);
    const deleteMutation = useDeleteGalleryImage(userId);

    const isAdmin = user?.role?.toLowerCase() === "admin";

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");

    // Edit modal state
    const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

    // File selection → open upload modal
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setShowUploadModal(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUploadModalClose = () => {
        setShowUploadModal(false);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl("");
    };

    const handleUpload = (title: string, tags: string[], isPrivate: boolean) => {
        if (!selectedFile) return;
        uploadMutation.mutate(
            { file: selectedFile, title, tags, isPrivate: isPrivate || undefined },
            { onSuccess: handleUploadModalClose }
        );
    };

    const handleEditSave = (data: {
        title: string;
        tags: string[];
        is_private: boolean;
    }) => {
        if (!editingImage) return;
        updateMutation.mutate(
            { imageId: editingImage.id, data },
            { onSuccess: () => setEditingImage(null) }
        );
    };

    const handleDelete = (img: GalleryImage) => {
        if (!window.confirm("Delete this image? This cannot be undone.")) return;
        deleteMutation.mutate(img.id);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex items-center justify-between mb-5 lg:mb-7">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Gallery
                    </h3>
                    {!readOnly && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadMutation.isPending}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                            {uploadMutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                                <svg
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            )}
                            Add Image
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>

                {images.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">
                        {readOnly
                            ? "No gallery images available."
                            : 'No images yet. Click "Add Image" to upload your first photo.'}
                    </p>
                ) : (
                    <GalleryGrid
                        images={images}
                        onImageClick={setLightboxUrl}
                        onEdit={!readOnly ? setEditingImage : undefined}
                        onDelete={isAdmin ? handleDelete : undefined}
                        isOwner={!readOnly}
                        isAdmin={isAdmin}
                    />
                )}
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <ImageLightbox
                    url={lightboxUrl}
                    onClose={() => setLightboxUrl(null)}
                />
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <GalleryUploadModal
                    previewUrl={previewUrl}
                    uploading={uploadMutation.isPending}
                    onClose={handleUploadModalClose}
                    onUpload={handleUpload}
                />
            )}

            {/* Edit Modal */}
            {editingImage && (
                <GalleryEditModal
                    image={editingImage}
                    saving={updateMutation.isPending}
                    onClose={() => setEditingImage(null)}
                    onSave={handleEditSave}
                />
            )}
        </>
    );
}
