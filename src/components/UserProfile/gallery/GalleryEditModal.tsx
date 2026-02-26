import { useState, useEffect } from "react";
import { GalleryImage } from "../../../api/user/imageService";

interface GalleryEditModalProps {
    image: GalleryImage;
    saving: boolean;
    onClose: () => void;
    onSave: (data: { title: string; tags: string[]; is_private: boolean }) => void;
}

export default function GalleryEditModal({
    image,
    saving,
    onClose,
    onSave,
}: GalleryEditModalProps) {
    const [title, setTitle] = useState(image.title || "");
    const [tagsInput, setTagsInput] = useState(
        (image.tags || []).join(", ")
    );
    const [isPrivate, setIsPrivate] = useState(image.is_private || false);

    // Sync when image changes
    useEffect(() => {
        setTitle(image.title || "");
        setTagsInput((image.tags || []).join(", "));
        setIsPrivate(image.is_private || false);
    }, [image]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        const tags = tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        onSave({ title: title.trim(), tags, is_private: isPrivate });
    };

    return (
        <div
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Edit Image Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Image preview */}
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                            src={image.url}
                            alt={image.title || image.filename}
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
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. State Championship Win"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Tags (comma-separated) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="e.g. 1st Place, Nationals, 2025"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            Separate multiple tags with commas
                        </p>
                    </div>

                    {/* Is Private toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Private
                            </label>
                            <p className="text-xs text-gray-400">
                                Hidden from the Academy Gallery
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPrivate(!isPrivate)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPrivate
                                    ? "bg-blue-600"
                                    : "bg-gray-300 dark:bg-gray-600"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivate ? "translate-x-6" : "translate-x-1"
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || saving}
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
    );
}
