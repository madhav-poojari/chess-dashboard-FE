// TypeScript interfaces for the Blog feature

export interface BlogTag {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

export interface BlogAuthor {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    email: string;
}

export interface Blog {
    id: string;
    slug: string;
    title: string;
    summary: string;
    content: Record<string, unknown>; // TipTap JSON object (JSONB)
    cover_image_url: string;
    author_id: string;
    author: BlogAuthor;
    visibility: "public" | "internal";
    status: "draft" | "published";
    published_at: string | null;
    created_at: string;
    updated_at: string;
    tags: BlogTag[];
    can_edit: boolean;
}

export interface BlogImage {
    id: string;
    blog_id: string;
    url_suffix: string;
    alt_text: string;
    created_at: string;
}

export interface CreateBlogPayload {
    title: string;
    summary: string;
    content: Record<string, unknown>;
    visibility: "public" | "internal";
    status: "draft" | "published";
    tags: string[];
}

export interface UpdateBlogPayload {
    title?: string;
    summary?: string;
    content?: Record<string, unknown>;
    visibility?: "public" | "internal";
    status?: "draft" | "published";
    tags?: string[];
}

export interface BlogListResponse {
    blogs: Blog[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
}
