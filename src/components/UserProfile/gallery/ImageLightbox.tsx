// Shared fullscreen lightbox for viewing images
interface ImageLightboxProps {
    url: string;
    onClose: () => void;
}

export default function ImageLightbox({ url, onClose }: ImageLightboxProps) {
    return (
        <div
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80"
            onClick={onClose}
        >
            <button
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                onClick={onClose}
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
                src={url}
                alt="Gallery preview"
                loading="lazy"
                decoding="async"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
