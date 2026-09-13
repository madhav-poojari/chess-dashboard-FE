import { Link } from "react-router";
import type { Blog } from "../../../api/blogs/types";
import { DateTime } from "luxon";

interface BlogCardProps {
    blog: Blog;
    r2BaseUrl?: string;
}

export default function BlogCard({ blog, r2BaseUrl = "" }: BlogCardProps) {
    const publishedDate = blog.published_at
        ? DateTime.fromISO(blog.published_at).toFormat("LLL dd, yyyy")
        : "Draft";

    const authorName = blog.author
        ? `${blog.author.first_name} ${blog.author.last_name}`
        : "Unknown";

    const coverUrl = blog.cover_image_url
        ? `${r2BaseUrl}/${blog.cover_image_url}`
        : null;

    return (
        <Link
            to={`/blogs/${blog.slug}`}
            className="group block rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-br from-brand-400 to-brand-600 overflow-hidden">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg
                            className="w-16 h-16 text-white/30"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                        </svg>
                    </div>
                )}

                {/* Visibility Badge */}
                {blog.visibility === "internal" && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 backdrop-blur-sm">
                        Internal
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {blog.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag.id}
                                className="px-2 py-0.5 text-xs font-medium rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                            >
                                {tag.name}
                            </span>
                        ))}
                        {blog.tags.length > 3 && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                +{blog.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors mb-2">
                    {blog.title}
                </h3>

                {/* Summary */}
                {blog.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                        {blog.summary}
                    </p>
                )}

                {/* Footer: Author + Date */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="font-medium">{authorName}</span>
                    <time dateTime={blog.published_at || blog.created_at}>
                        {publishedDate}
                    </time>
                </div>
            </div>
        </Link>
    );
}
