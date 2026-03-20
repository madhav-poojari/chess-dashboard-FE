import { createContext, useContext, useCallback, useState, useRef } from "react";

type ToastVariant = "success" | "error";

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    toasts: ToastItem[];
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
    };
    removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counterRef = useRef(0);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, variant: ToastVariant) => {
            const id = ++counterRef.current;
            setToasts((prev) => {
                const next = [...prev, { id, message, variant }];
                // keep only the latest MAX_TOASTS
                return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
            });
            setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
        },
        [removeToast]
    );

    const toast = {
        success: (message: string) => addToast(message, "success"),
        error: (message: string) => addToast(message, "error"),
    };

    return (
        <ToastContext.Provider value={{ toasts, toast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within a <ToastProvider>");
    }
    return ctx.toast;
}

export { ToastContext };
export type { ToastItem, ToastVariant };
