import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../constants/queryKeys";
import {
    listBlogs,
    getBlog,
    createBlog,
    updateBlog,
    deleteBlog,
    listMyDrafts,
    listBlogTags,
    uploadCoverImage,
    deleteCoverImage,
} from "../api/blogs/blogService";
import type {
    Blog,
    BlogListResponse,
    BlogTag,
    CreateBlogPayload,
    UpdateBlogPayload,
} from "../api/blogs/types";
import { useToast } from "../context/ToastContext";

// ─── Queries ────────────────────────────────────────────────────────────────────

export function useBlogList(page: number, pageSize: number = 12) {
    return useQuery<BlogListResponse>({
        queryKey: queryKeys.blogs.list(page, pageSize),
        queryFn: () => listBlogs(page, pageSize),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useBlogDetail(slug: string) {
    return useQuery<Blog>({
        queryKey: queryKeys.blogs.detail(slug),
        queryFn: () => getBlog(slug),
        enabled: !!slug,
    });
}

export function useMyDrafts() {
    return useQuery<Blog[]>({
        queryKey: queryKeys.blogs.myDrafts(),
        queryFn: listMyDrafts,
        staleTime: 1 * 60 * 1000,
    });
}

export function useBlogTags() {
    return useQuery<BlogTag[]>({
        queryKey: queryKeys.blogs.tags(),
        queryFn: listBlogTags,
        staleTime: 5 * 60 * 1000,
    });
}

// ─── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateBlog() {
    const qc = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (payload: CreateBlogPayload) => createBlog(payload),
        onSuccess: (_data, variables) => {
            // Invalidate blog list and drafts
            qc.invalidateQueries({ queryKey: ["blogs"] });
            const msg =
                variables.status === "published"
                    ? "Blog published successfully!"
                    : "Draft saved successfully!";
            toast.success(msg);
        },
        onError: () => {
            toast.error("Failed to create blog. Please try again.");
        },
    });
}

export function useUpdateBlog() {
    const qc = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateBlogPayload;
        }) => updateBlog(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["blogs"] });
            toast.success("Blog updated successfully!");
        },
        onError: () => {
            toast.error("Failed to update blog. Please try again.");
        },
    });
}

export function useDeleteBlog() {
    const qc = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id: string) => deleteBlog(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["blogs"] });
            toast.success("Blog deleted successfully.");
        },
        onError: () => {
            toast.error("Failed to delete blog. Please try again.");
        },
    });
}

export function useUploadCoverImage() {
    const qc = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ blogId, file }: { blogId: string; file: File }) =>
            uploadCoverImage(blogId, file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["blogs"] });
            toast.success("Cover image uploaded!");
        },
        onError: () => {
            toast.error("Failed to upload cover image.");
        },
    });
}

export function useDeleteCoverImage() {
    const qc = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (blogId: string) => deleteCoverImage(blogId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["blogs"] });
            toast.success("Cover image removed.");
        },
        onError: () => {
            toast.error("Failed to remove cover image.");
        },
    });
}
