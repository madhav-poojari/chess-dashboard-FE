import React, { useContext, useEffect, useState } from "react";
import { ToastContext, ToastItem, ToastVariant } from "../../context/ToastContext";

const ICONS: Record<ToastVariant, React.ReactNode> = {
    success: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const BORDER_COLORS: Record<ToastVariant, string> = {
    success: "border-l-green-500",
    error: "border-l-red-500",
};

function SingleToast({
    toast,
    onClose,
}: {
    toast: ToastItem;
    onClose: (id: number) => void;
}) {
    const [visible, setVisible] = useState(false);

    // Slide-in on mount
    useEffect(() => {
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => onClose(toast.id), 200);
    };

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border border-l-4
                bg-white dark:bg-gray-800
                border-gray-200 dark:border-gray-700
                ${BORDER_COLORS[toast.variant]}
                transition-all duration-200 ease-out
                ${visible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-8"
                }
            `}
            role="alert"
        >
            <span className="flex-shrink-0">{ICONS[toast.variant]}</span>
            <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                {toast.message}
            </p>
            <button
                onClick={handleClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const ctx = useContext(ToastContext);
    if (!ctx) return null;

    const { toasts, removeToast } = ctx;

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <SingleToast toast={t} onClose={removeToast} />
                </div>
            ))}
        </div>
    );
}
