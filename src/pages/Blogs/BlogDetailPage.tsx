import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Helmet } from "react-helmet-async";
import { useBlogDetail, useDeleteBlog } from "../../hooks/useBlogs";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../api/user/dto";
import { DateTime } from "luxon";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";

export default function BlogDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: blog, isLoading, isError } = useBlogDetail(slug || "");
    const deleteMutation = useDeleteBlog();

    const r2BaseUrl = useMemo(() => {
        return (import.meta.env.VITE_R2_PUBLIC_URL as string) || "";
    }, []);

    // Convert TipTap JSON to HTML for rendering
    const htmlContent = useMemo(() => {
        if (!blog?.content) return "";
        try {
            return generateHTML(blog.content, [
                StarterKit,
                Underline,
                TextAlign.configure({ types: ["heading", "paragraph"] }),
                ImageExt,
                LinkExt.configure({ openOnClick: false }),
            ]);
        } catch {
            return "";
        }
    }, [blog?.content]);

    const canEdit = useMemo(() => {
        if (!user || !blog) return false;
        if (user.id === blog.author_id) return true;
        if (user.role === UserRole.ADMIN) return true;
        // Higher-role related users can also edit (handled server-side,
        // but we show the button optimistically for mentor/coach roles)
        if (
            user.role === UserRole.MENTOR_COACH ||
            user.role === UserRole.COACH
        ) {
            return true; // server will enforce the actual relation check
        }
        return false;
    }, [user, blog]);

    const handleDelete = () => {
        if (!blog) return;
        if (!window.confirm("Are you sure you want to delete this blog?"))
            return;
        deleteMutation.mutate(blog.id, {
            onSuccess: () => navigate("/blogs"),
        });
    };

    if (isLoading) {
        return <BlogDetailSkeleton />;
    }

    if (isError || !blog) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Blog not found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    The blog you're looking for doesn't exist or has been
                    removed.
                </p>
                <Link
                    to="/blogs"
                    className="text-brand-600 hover:text-brand-700 font-medium"
                >
                    ← Back to Blogs
                </Link>
            </div>
        );
    }

    const authorName = blog.author
        ? `${blog.author.first_name} ${blog.author.last_name}`
        : "Unknown";

    const publishedDate = blog.published_at
        ? DateTime.fromISO(blog.published_at).toFormat("LLLL dd, yyyy")
        : "Draft";

    const coverUrl = blog.cover_image_url
        ? `${r2BaseUrl}/${blog.cover_image_url}`
        : null;

    return (
        <>
            <Helmet>
                <title>{blog.title} | BRS Chess Academy Blog</title>
                <meta
                    name="description"
                    content={
                        blog.summary || `${blog.title} - BRS Chess Academy Blog`
                    }
                />
            </Helmet>

            <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Back link */}
                <Link
                    to="/blogs"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-6"
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
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to Blogs
                </Link>

                {/* Cover Image */}
                {coverUrl && (
                    <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[21/9]">
                        <img
                            src={coverUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Header */}
                <header className="mb-8">
                    {/* Tags + Visibility */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {blog.visibility === "internal" && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200">
                                Internal
                            </span>
                        )}
                        {blog.status === "draft" && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Draft
                            </span>
                        )}
                        {blog.tags?.map((tag) => (
                            <span
                                key={tag.id}
                                className="px-2.5 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                        {blog.title}
                    </h1>

                    {/* Summary */}
                    {blog.summary && (
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                            {blog.summary}
                        </p>
                    )}

                    {/* Author + Date + Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm">
                                {blog.author?.first_name?.[0]}
                                {blog.author?.last_name?.[0]}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {authorName}
                                </p>
                                <time
                                    dateTime={
                                        blog.published_at || blog.created_at
                                    }
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                >
                                    {publishedDate}
                                </time>
                            </div>
                        </div>

                        {canEdit && (
                            <div className="flex items-center gap-2">
                                <Link
                                    to={`/blogs/${blog.slug}/edit`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                    Edit
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content */}
                <section
                    className="blog-rich-text prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </article>
        </>
    );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

function BlogDetailSkeleton() {
    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-8" />
            <div className="space-y-4">
                <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
                <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />
                <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </div>
        </div>
    );
}
