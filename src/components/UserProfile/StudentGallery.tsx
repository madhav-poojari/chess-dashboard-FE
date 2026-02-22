import { useState, useEffect, useRef } from "react";
import {
    listGalleryImages,
    uploadGalleryImage,
    deleteGalleryImage,
    updateGalleryImageMetadata,
    GalleryImage,
} from "../../api/user/imageService";

interface StudentGalleryProps {
    userId: string;
    readOnly?: boolean;
}

export default function StudentGallery({
    userId,
    readOnly = false,
}: StudentGalleryProps) {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [metaTitle, setMetaTitle] = useState("");
    const [metaPosition, setMetaPosition] = useState("");
    const [metaPrivate, setMetaPrivate] = useState(false);

    // Edit modal state
    const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const data = await listGalleryImages(userId);
            setImages(data);
        } catch (err) {
            console.error("Failed to load gallery:", err);
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // When a file is selected, show the metadata modal instead of uploading immediately
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setMetaTitle("");
        setMetaPosition("");
        setMetaPrivate(false);
        setShowModal(true);

        // Reset file input so same file can be re-selected later
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleModalClose = () => {
        setShowModal(false);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl("");
    };

    const handleModalUpload = async () => {
        if (!selectedFile || !metaTitle.trim()) return;

        setUploading(true);
        try {
            await uploadGalleryImage(
                userId,
                selectedFile,
                metaTitle.trim(),
                metaPosition.trim() || undefined,
                metaPrivate || undefined
            );
            await fetchImages();
            handleModalClose();
        } catch (err) {
            console.error("Failed to upload gallery image:", err);
        } finally {
            setUploading(false);
        }
    };

    // Edit metadata
    const handleEditOpen = (img: GalleryImage) => {
        setEditingImage(img);
        setMetaTitle(img.title || "");
        setMetaPosition(img.position_in_tournament || "");
        setMetaPrivate(img.is_private || false);
    };

    const handleEditClose = () => {
        setEditingImage(null);
    };

    const handleEditSave = async () => {
        if (!editingImage || !metaTitle.trim()) return;

        setSaving(true);
        try {
            await updateGalleryImageMetadata(userId, editingImage.id, {
                title: metaTitle.trim(),
                position_in_tournament: metaPosition.trim(),
                is_private: metaPrivate,
            });
            await fetchImages();
            handleEditClose();
        } catch (err) {
            console.error("Failed to update image metadata:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (imageId: number) => {
        if (!window.confirm("Delete this image?")) return;
        try {
            await deleteGalleryImage(userId, imageId);
            setImages((prev) => prev.filter((img) => img.id !== imageId));
        } catch (err) {
            console.error("Failed to delete gallery image:", err);
        }
    };

    if (loading) {
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
                            disabled={uploading}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                            {uploading ? (
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
                            : "No images yet. Click \"Add Image\" to upload your first photo."}
                    </p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {images.map((img) => (
                            <div
                                key={img.id}
                                className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square bg-gray-100 dark:bg-gray-800"
                            >
                                <img
                                    src={img.url}
                                    alt={img.title || img.filename}
                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                    onClick={() => setLightboxUrl(img.url)}
                                />

                                {/* Title & position overlay */}
                                {(img.title || img.position_in_tournament) && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                        {img.title && (
                                            <p className="text-sm font-medium text-white truncate">
                                                {img.title}
                                            </p>
                                        )}
                                        {img.position_in_tournament && (
                                            <p className="text-xs text-white/80 truncate">
                                                {img.position_in_tournament}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Private badge */}
                                {img.is_private && (
                                    <div className="absolute top-2 left-2">
                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 rounded">
                                            Private
                                        </span>
                                    </div>
                                )}

                                {/* Action buttons (edit + delete) */}
                                {!readOnly && (
                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Edit button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditOpen(img);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500/80 hover:bg-blue-600 text-white"
                                            title="Edit metadata"
                                        >
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </button>
                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(img.id);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-600 text-white"
                                            title="Delete image"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Gallery preview"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Upload Metadata Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60"
                    onClick={handleModalClose}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Image Details
                            </h3>
                            <button
                                onClick={handleModalClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 py-5 space-y-4">
                            {/* Image preview */}
                            {previewUrl && (
                                <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}

                            {/* Title (required) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    placeholder="e.g. State Championship Win"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Position in Tournament (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Position in Tournament
                                </label>
                                <input
                                    type="text"
                                    value={metaPosition}
                                    onChange={(e) => setMetaPosition(e.target.value)}
                                    placeholder="e.g. 1st Place"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Is Private toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Private
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setMetaPrivate(!metaPrivate)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${metaPrivate
                                            ? "bg-blue-600"
                                            : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${metaPrivate ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleModalClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalUpload}
                                disabled={!metaTitle.trim() || uploading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                            >
                                {uploading && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                )}
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Metadata Modal */}
            {editingImage && (
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60"
                    onClick={handleEditClose}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Edit Image Details
                            </h3>
                            <button
                                onClick={handleEditClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 py-5 space-y-4">
                            {/* Image preview (existing image) */}
                            <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <img
                                    src={editingImage.url}
                                    alt={editingImage.title || editingImage.filename}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Title (required) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    placeholder="e.g. State Championship Win"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Position in Tournament (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Position in Tournament
                                </label>
                                <input
                                    type="text"
                                    value={metaPosition}
                                    onChange={(e) => setMetaPosition(e.target.value)}
                                    placeholder="e.g. 1st Place"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Is Private toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Private
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setMetaPrivate(!metaPrivate)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${metaPrivate
                                            ? "bg-blue-600"
                                            : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${metaPrivate ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleEditClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={!metaTitle.trim() || saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                            >
                                {saving && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                )}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
