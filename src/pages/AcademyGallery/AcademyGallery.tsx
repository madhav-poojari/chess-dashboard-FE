import { useState } from "react";
import { useAcademyGallery } from "../../hooks/useAcademyGallery";
import { useDeleteGalleryImage } from "../../hooks/useGallery";
import { useAuth } from "../../context/AuthContext";
import ImageLightbox from "../../components/UserProfile/gallery/ImageLightbox";

export default function AcademyGallery() {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const PAGE_SIZE = 12;
    const { data, isLoading } = useAcademyGallery(page, PAGE_SIZE);

    const images = data?.images || [];
    const totalPages = data?.total_pages || 1;
    const total = data?.total || 0;

    const isAdmin = user?.role?.toLowerCase() === "admin";

    const deleteMutation = useDeleteGalleryImage(user?.id || "");

    const handleDelete = (imageId: number) => {
        if (!window.confirm("Delete this image? This cannot be undone.")) return;
        deleteMutation.mutate(imageId);
    };

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages) return;
        setPage(p);
    };

    // Generate page numbers for pagination
    const getPageNumbers = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push("...");
            for (
                let i = Math.max(2, page - 1);
                i <= Math.min(totalPages - 1, page + 1);
                i++
            ) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5 lg:mb-7">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Academy Gallery
                        </h3>
                        {!isLoading && total > 0 && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {total} photo{total !== 1 ? "s" : ""} from our students
                            </p>
                        )}
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-500 dark:text-gray-400">
                        <svg
                            className="w-16 h-16 mb-3 opacity-40"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <p className="text-sm">No gallery images yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Image grid */}
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

                                    {/* Info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
                                        {img.title && (
                                            <p className="text-sm font-medium text-white truncate">
                                                {img.title}
                                            </p>
                                        )}
                                        {img.tags && img.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {img.tags.map((tag: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="px-1.5 py-0.5 text-[10px] font-medium bg-white/20 text-white rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-[11px] text-white/60 truncate mt-0.5">
                                            by {img.user_first_name} {img.user_last_name}
                                        </p>
                                    </div>

                                    {/* Admin delete button */}
                                    {isAdmin && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(img.id);
                                                }}
                                                disabled={deleteMutation.isPending}
                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-600 text-white disabled:opacity-50"
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
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1.5 mt-6">
                                <button
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Prev
                                </button>

                                {getPageNumbers().map((p, idx) =>
                                    p === "..." ? (
                                        <span
                                            key={`dots-${idx}`}
                                            className="px-2 py-1.5 text-sm text-gray-400"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p)}
                                            className={`min-w-[36px] px-2 py-1.5 text-sm rounded-lg transition-colors ${p === page
                                                ? "bg-blue-600 text-white font-medium"
                                                : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <ImageLightbox
                    url={lightboxUrl}
                    onClose={() => setLightboxUrl(null)}
                />
            )}
        </>
    );
}
