import { useState } from "react";
import { useAcademyGallery } from "../../hooks/useAcademyGallery";
import { useDeleteGalleryImage } from "../../hooks/useGallery";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../api/user/dto";
import { AcademyGalleryImage, GalleryImage } from "../../api/user/imageService";
import GalleryGrid from "../../components/UserProfile/gallery/GalleryGrid";
import ImageLightbox from "../../components/UserProfile/gallery/ImageLightbox";
import Pagination from "../../components/ui/Pagination";

export default function AcademyGallery() {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const PAGE_SIZE = 12;
    const { data, isLoading, isError, error } = useAcademyGallery(page, PAGE_SIZE);

    const images = data?.images || [];
    const totalPages = data?.total_pages || 1;
    const total = data?.total || 0;

    const isAdmin = user?.role === UserRole.ADMIN;

    const deleteMutation = useDeleteGalleryImage(user?.id || "");

    const handleDelete = (img: GalleryImage) => {
        if (!window.confirm("Delete this image? This cannot be undone.")) return;
        deleteMutation.mutate(img.id);
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
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center min-h-[200px] text-red-500 dark:text-red-400">
                        <p className="text-sm">Failed to load academy gallery.</p>
                        <p className="text-xs mt-1 text-gray-400">{error?.message}</p>
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
                        <GalleryGrid
                            images={images}
                            onImageClick={setLightboxUrl}
                            onDelete={isAdmin ? handleDelete : undefined}
                            isAdmin={isAdmin}
                            authorInfo={(img) => {
                                const academyImg = img as AcademyGalleryImage;
                                if (academyImg.user_first_name || academyImg.user_last_name) {
                                    return `by ${academyImg.user_first_name} ${academyImg.user_last_name}`;
                                }
                                return undefined;
                            }}
                        />

                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
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
