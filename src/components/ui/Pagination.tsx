interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function getPageNumbers(
    currentPage: number,
    totalPages: number
): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push("...");
        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        ) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
    }
    return pages;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages) return;
        onPageChange(p);
    };

    return (
        <div className="flex items-center justify-center gap-1.5 mt-6">
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                ← Prev
            </button>

            {getPageNumbers(currentPage, totalPages).map((p, idx) =>
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
                        className={`min-w-[36px] px-2 py-1.5 text-sm rounded-lg transition-colors ${
                            p === currentPage
                                ? "bg-blue-600 text-white font-medium"
                                : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Next →
            </button>
        </div>
    );
}
