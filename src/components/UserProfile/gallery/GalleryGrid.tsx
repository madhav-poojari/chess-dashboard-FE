// Tag chips display + overlay for gallery image cards
import { GalleryImage } from "../../../api/user/imageService";
import { getImageUrl } from "../../../utils/imageUrl";

interface GalleryGridProps {
    images: GalleryImage[];
    onImageClick: (url: string) => void;
    onEdit?: (img: GalleryImage) => void;
    onDelete?: (img: GalleryImage) => void;
    /** Whether the current user can edit (owner, coach, mentor, admin) */
    isOwner?: boolean;
    /** Whether the current user is an admin (shows delete button) */
    isAdmin?: boolean;
}

export default function GalleryGrid({
    images,
    onImageClick,
    onEdit,
    onDelete,
    isOwner = false,
    isAdmin = false,
}: GalleryGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img) => (
                <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square bg-gray-100 dark:bg-gray-800"
                >
                    <img
                        src={getImageUrl(img.url_suffix)}
                        alt={img.title || "Gallery image"}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => onImageClick(getImageUrl(img.url_suffix))}
                    />

                    {/* Title & tags overlay */}
                    {(img.title || (img.tags && img.tags.length > 0)) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            {img.title && (
                                <p className="text-sm font-medium text-white truncate">
                                    {img.title}
                                </p>
                            )}
                            {img.tags && img.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {img.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-1.5 py-0.5 text-[10px] font-medium bg-white/20 text-white rounded"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
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
                    {(isOwner || isAdmin) && (
                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isOwner && onEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(img);
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
                            )}
                            {isAdmin && onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(img);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-600 text-white"
                                    title="Delete image (Admin)"
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
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
