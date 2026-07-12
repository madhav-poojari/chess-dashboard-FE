import api from "../axiosInstance";
import type {
    Blog,
    BlogTag,
    BlogImage,
    BlogListResponse,
    CreateBlogPayload,
    UpdateBlogPayload,
} from "./types";

// ─── Blog CRUD ──────────────────────────────────────────────────────────────────

export const listBlogs = async (
    page: number = 1,
    pageSize: number = 12
): Promise<BlogListResponse> => {
    const response = await api.get("/blogs", {
        params: { page, page_size: pageSize },
    });
    return response.data.data;
};

export const getBlog = async (slug: string): Promise<Blog> => {
    const response = await api.get(`/blogs/${slug}`);
    return response.data.data;
};

export const createBlog = async (payload: CreateBlogPayload): Promise<Blog> => {
    const response = await api.post("/blogs", payload);
    return response.data.data;
};

export const updateBlog = async (
    id: string,
    payload: UpdateBlogPayload
): Promise<Blog> => {
    const response = await api.patch(`/blogs/${id}`, payload);
    return response.data.data;
};

export const deleteBlog = async (id: string): Promise<void> => {
    await api.delete(`/blogs/${id}`);
};

// ─── Drafts ─────────────────────────────────────────────────────────────────────

export const listMyDrafts = async (): Promise<Blog[]> => {
    const response = await api.get("/blogs/my-drafts");
    return response.data.data;
};

// ─── Tags ───────────────────────────────────────────────────────────────────────

export const listBlogTags = async (): Promise<BlogTag[]> => {
    const response = await api.get("/blogs/tags");
    return response.data.data;
};

// ─── Blog Images ────────────────────────────────────────────────────────────────

export const uploadBlogImage = async (
    blogId: string,
    file: File,
    altText?: string
): Promise<{ id: string; url_suffix: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (altText) formData.append("alt_text", altText);

    const response = await api.post(`/blogs/${blogId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
};

export const listBlogImages = async (blogId: string): Promise<BlogImage[]> => {
    const response = await api.get(`/blogs/${blogId}/images`);
    return response.data.data;
};

export const deleteBlogImage = async (
    blogId: string,
    imageId: string
): Promise<void> => {
    await api.delete(`/blogs/${blogId}/images/${imageId}`);
};

// ─── Cover Image ────────────────────────────────────────────────────────────────

export const uploadCoverImage = async (
    blogId: string,
    file: File
): Promise<{ url_suffix: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/blogs/${blogId}/cover`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
};

export const deleteCoverImage = async (blogId: string): Promise<void> => {
    await api.delete(`/blogs/${blogId}/cover`);
};
