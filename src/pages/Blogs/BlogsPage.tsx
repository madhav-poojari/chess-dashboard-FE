import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Helmet } from "react-helmet-async";
import { useBlogList, useMyDrafts } from "../../hooks/useBlogs";
import BlogCard from "./components/BlogCard";
import { useAuth } from "../../context/AuthContext";

const PAGE_SIZE = 12;

export default function BlogsPage() {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");

    const { data: blogData, isLoading, isError } = useBlogList(page, PAGE_SIZE);
    const { data: drafts, isLoading: draftsLoading } = useMyDrafts();

    // Derive R2 base URL from env if available
    const r2BaseUrl = useMemo(() => {
        return import.meta.env.VITE_R2_PUBLIC_URL as string || "";
    }, []);

    const blogs = blogData?.blogs ?? [];
    const totalPages = blogData?.total_pages ?? 1;
    const total = blogData?.total ?? 0;

    const myDrafts = drafts ?? [];

    return (
        <>
            <Helmet>
                <title>Blogs | BRS Chess Academy</title>
                <meta
                    name="description"
                    content="Read the latest blogs, insights, and updates from BRS Chess Academy coaches and students."
                />
            </Helmet>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Blogs
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Insights, strategies, and updates from the academy
                        </p>
                    </div>
                    {user && (
                        <Link
                            to="/blogs/new"
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-brand-500 hover:bg-brand-600 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Write a Blog
                        </Link>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    <button
                        onClick={() => { setActiveTab("published"); setPage(1); }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === "published"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                    >
                        Published
                        {total > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                {total}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("drafts")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === "drafts"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                    >
                        My Drafts
                        {myDrafts.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                {myDrafts.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Published Tab */}
                {activeTab === "published" && (
                    <>
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <BlogCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="text-center py-16">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Failed to load blogs. Please try again later.
                                </p>
                            </div>
                        ) : blogs.length === 0 ? (
                            <EmptyState
                                title="No blogs yet"
                                description="Be the first to share your chess insights!"
                            />
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {blogs.map((blog) => (
                                        <BlogCard
                                            key={blog.id}
                                            blog={blog}
                                            r2BaseUrl={r2BaseUrl}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Drafts Tab */}
                {activeTab === "drafts" && (
                    <>
                        {draftsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <BlogCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : myDrafts.length === 0 ? (
                            <EmptyState
                                title="No drafts"
                                description="Drafts you save will appear here."
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myDrafts.map((blog) => (
                                    <div key={blog.id} className="relative">
                                        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-800/70 text-white backdrop-blur-sm">
                                            Draft
                                        </span>
                                        <BlogCard
                                            blog={blog}
                                            r2BaseUrl={r2BaseUrl}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function BlogCardSkeleton() {
    return (
        <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700" />
            <div className="p-5 space-y-3">
                <div className="flex gap-2">
                    <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div className="text-center py-16">
            <svg
                className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
            </p>
        </div>
    );
}
