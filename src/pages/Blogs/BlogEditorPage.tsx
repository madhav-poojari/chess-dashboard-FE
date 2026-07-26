import { useReducer, useMemo, useCallback, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import BlogEditorToolbar from "./components/BlogEditorToolbar";
import TagInput from "./components/TagInput";
import {
    useCreateBlog,
    useUpdateBlog,
    useBlogDetail,
    useBlogTags,
    useUploadCoverImage,
    useDeleteCoverImage,
} from "../../hooks/useBlogs";
import { uploadBlogImage, updateBlog as updateBlogApi } from "../../api/blogs/blogService";
import { useToast } from "../../context/ToastContext";

// ─── State ──────────────────────────────────────────────────────────────────────

interface EditorState {
    title: string;
    summary: string;
    visibility: "public" | "internal";
    tags: string[];
    coverPreview: string | null;
    coverFile: File | null;
    isSaving: boolean;
}

type EditorAction =
    | { type: "SET_FIELD"; field: keyof EditorState; value: unknown }
    | { type: "SET_COVER"; file: File | null; preview: string | null }
    | { type: "SET_SAVING"; value: boolean }
    | { type: "LOAD_BLOG"; payload: Partial<EditorState> };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
        case "SET_FIELD":
            return { ...state, [action.field]: action.value };
        case "SET_COVER":
            return {
                ...state,
                coverFile: action.file,
                coverPreview: action.preview,
            };
        case "SET_SAVING":
            return { ...state, isSaving: action.value };
        case "LOAD_BLOG":
            return { ...state, ...action.payload };
        default:
            return state;
    }
}

const initialState: EditorState = {
    title: "",
    summary: "",
    visibility: "public",
    tags: [],
    coverPreview: null,
    coverFile: null,
    isSaving: false,
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function BlogEditorPage() {
    const { slug } = useParams<{ slug: string }>();
    const isEditMode = !!slug;
    const navigate = useNavigate();
    const toast = useToast();
    const coverInputRef = useRef<HTMLInputElement>(null);
    const [editorMode, setEditorMode] = useState<"richtext" | "markdown">("richtext");
    const [markdownSource, setMarkdownSource] = useState("");
    const pendingImagesRef = useRef<Map<string, File>>(new Map());

    const [state, dispatch] = useReducer(editorReducer, initialState);

    // Fetch existing blog for edit mode
    const { data: existingBlog, isLoading: blogLoading } = useBlogDetail(
        slug || ""
    );

    // Fetch tag suggestions
    const { data: allTags } = useBlogTags();
    const tagSuggestions = useMemo(
        () => (allTags ?? []).map((t) => t.name),
        [allTags]
    );

    const r2BaseUrl = useMemo(() => {
        return (import.meta.env.VITE_R2_PUBLIC_URL as string) || "";
    }, []);

    const createMutation = useCreateBlog();
    const updateMutation = useUpdateBlog();
    const uploadCoverMutation = useUploadCoverImage();
    const deleteCoverMutation = useDeleteCoverImage();

    // TipTap editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            ImageExt.configure({ inline: false, allowBase64: false }),
            LinkExt.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-brand-600 underline hover:text-brand-700",
                },
            }),
            Placeholder.configure({
                placeholder: "Start writing your blog post...",
            }),
            Markdown,
        ],
        editorProps: {
            attributes: {
                class: "blog-editor-content blog-rich-text prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-5 py-4",
            },
        },
        onCreate: ({ editor: ed }) => {
            // Load existing content if in edit mode
            if (existingBlog?.content) {
                ed.commands.setContent(existingBlog.content);
                dispatch({
                    type: "LOAD_BLOG",
                    payload: {
                        title: existingBlog.title,
                        summary: existingBlog.summary || "",
                        visibility: existingBlog.visibility,
                        tags: existingBlog.tags?.map((t) => t.name) || [],
                        coverPreview: existingBlog.cover_image_url
                            ? `${r2BaseUrl}/${existingBlog.cover_image_url}`
                            : null,
                    },
                });
            }
        },
    });

    // Re-populate editor when existing blog loads (for edit mode)
    useMemo(() => {
        if (existingBlog && editor && isEditMode) {
            editor.commands.setContent(existingBlog.content);
            dispatch({
                type: "LOAD_BLOG",
                payload: {
                    title: existingBlog.title,
                    summary: existingBlog.summary || "",
                    visibility: existingBlog.visibility,
                    tags: existingBlog.tags?.map((t) => t.name) || [],
                    coverPreview: existingBlog.cover_image_url
                        ? `${r2BaseUrl}/${existingBlog.cover_image_url}`
                        : null,
                },
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingBlog, editor]);

    // ─── Image upload within editor ─────────────────────────────────────────

    const handleEditorImageUpload = useCallback(async () => {
        if (!editor) return;

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            // For new blogs, we need to save first. For existing blogs, upload directly.
            if (isEditMode && existingBlog) {
                try {
                    const result = await uploadBlogImage(
                        existingBlog.id,
                        file
                    );
                    const imageUrl = `${r2BaseUrl}/${result.url_suffix}`;
                    editor
                        .chain()
                        .focus()
                        .setImage({ src: imageUrl, alt: file.name })
                        .run();
                } catch {
                    toast.error("Failed to upload image.");
                }
            } else {
                // For unsaved blogs, use a temporary object URL and track the file
                const tempUrl = URL.createObjectURL(file);
                pendingImagesRef.current.set(tempUrl, file);
                editor
                    .chain()
                    .focus()
                    .setImage({ src: tempUrl, alt: file.name })
                    .run();
            }
        };
        input.click();
    }, [editor, isEditMode, existingBlog, r2BaseUrl, toast]);

    // ─── Cover image ────────────────────────────────────────────────────────

    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        dispatch({ type: "SET_COVER", file, preview });
    };

    const handleRemoveCover = () => {
        if (isEditMode && existingBlog?.cover_image_url) {
            deleteCoverMutation.mutate(existingBlog.id);
        }
        dispatch({ type: "SET_COVER", file: null, preview: null });
    };

    // ─── Save / Publish ─────────────────────────────────────────────────────

    // ─── Mode toggle ────────────────────────────────────────────────────────

    const handleToggleMode = useCallback(() => {
        if (!editor) return;
        if (editorMode === "richtext") {
            // Switching to markdown: serialize editor content to markdown
            const md = editor.storage.markdown.getMarkdown();
            setMarkdownSource(md);
            setEditorMode("markdown");
        } else {
            // Switching to rich text: parse markdown back into the editor
            editor.commands.setContent(markdownSource, true);
            setEditorMode("richtext");
        }
    }, [editor, editorMode, markdownSource]);

    // ─── Save / Publish ─────────────────────────────────────────────────────

    const handleSave = useCallback(
        async (status: "draft" | "published") => {
            if (!editor) return;
            if (!state.title.trim()) {
                toast.error("Please add a title for your blog.");
                return;
            }

            dispatch({ type: "SET_SAVING", value: true });

            // If in markdown mode, sync markdown back to editor before saving
            if (editorMode === "markdown") {
                editor.commands.setContent(markdownSource, true);
            }

            const content = editor.getJSON();

            try {
                if (isEditMode && existingBlog) {
                    // Update
                    await updateMutation.mutateAsync({
                        id: existingBlog.id,
                        payload: {
                            title: state.title,
                            summary: state.summary,
                            content,
                            visibility: state.visibility,
                            status,
                            tags: state.tags,
                        },
                    });

                    // Upload cover if changed
                    if (state.coverFile) {
                        await uploadCoverMutation.mutateAsync({
                            blogId: existingBlog.id,
                            file: state.coverFile,
                        });
                    }

                    navigate(`/blogs/${existingBlog.slug}`);
                } else {
                    // Create
                    const newBlog = await createMutation.mutateAsync({
                        title: state.title,
                        summary: state.summary,
                        content,
                        visibility: state.visibility,
                        status,
                        tags: state.tags,
                    });

                    // Upload cover if present
                    if (state.coverFile && newBlog?.id) {
                        await uploadCoverMutation.mutateAsync({
                            blogId: newBlog.id,
                            file: state.coverFile,
                        });
                    }

                    // Upload pending content images and replace blob URLs
                    if (pendingImagesRef.current.size > 0 && newBlog?.id) {
                        const urlReplacements = new Map<string, string>();

                        for (const [blobUrl, imgFile] of pendingImagesRef.current.entries()) {
                            try {
                                const result = await uploadBlogImage(newBlog.id, imgFile);
                                const realUrl = `${r2BaseUrl}/${result.url_suffix}`;
                                urlReplacements.set(blobUrl, realUrl);
                            } catch {
                                toast.error(`Failed to upload image: ${imgFile.name}`);
                            }
                            // Revoke the temporary blob URL to free memory
                            URL.revokeObjectURL(blobUrl);
                        }

                        if (urlReplacements.size > 0) {
                            const patchedContent = replaceBlobUrls(content, urlReplacements);
                            await updateBlogApi(newBlog.id, { content: patchedContent });
                        }

                        pendingImagesRef.current.clear();
                    }

                    if (status === "published" && newBlog?.slug) {
                        navigate(`/blogs/${newBlog.slug}`);
                    } else {
                        navigate("/blogs");
                    }
                }
            } catch {
                // Errors are already handled by mutation hooks via toast
            } finally {
                dispatch({ type: "SET_SAVING", value: false });
            }
        },
        [
            editor,
            state,
            isEditMode,
            existingBlog,
            createMutation,
            updateMutation,
            uploadCoverMutation,
            navigate,
            toast,
            editorMode,
            markdownSource,
        ]
    );

    if (isEditMode && blogLoading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>
                    {isEditMode ? "Edit Blog" : "Write a Blog"} | BRS Chess
                    Academy
                </title>
            </Helmet>

            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? "Edit Blog" : "Write a Blog"}
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleSave("draft")}
                            disabled={state.isSaving}
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {state.isSaving ? "Saving..." : "Save Draft"}
                        </button>
                        <button
                            onClick={() => handleSave("published")}
                            disabled={state.isSaving}
                            className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-brand-500 hover:bg-brand-600 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                            {state.isSaving ? "Publishing..." : "Publish"}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Cover Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cover Image{" "}
                            <span className="text-gray-400 font-normal">
                                (optional)
                            </span>
                        </label>
                        {state.coverPreview ? (
                            <div className="relative rounded-xl overflow-hidden aspect-[21/9] bg-gray-100 dark:bg-gray-800">
                                <img
                                    src={state.coverPreview}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveCover}
                                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="w-full aspect-[21/9] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Click to add a cover image
                                </span>
                            </button>
                        )}
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverSelect}
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <input
                            type="text"
                            value={state.title}
                            onChange={(e) =>
                                dispatch({
                                    type: "SET_FIELD",
                                    field: "title",
                                    value: e.target.value,
                                })
                            }
                            placeholder="Blog title..."
                            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                        />
                    </div>

                    {/* Summary */}
                    <div>
                        <textarea
                            value={state.summary}
                            onChange={(e) =>
                                dispatch({
                                    type: "SET_FIELD",
                                    field: "summary",
                                    value: e.target.value,
                                })
                            }
                            placeholder="Write a brief summary..."
                            rows={2}
                            className="w-full text-base bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600 resize-none"
                        />
                    </div>

                    {/* Tags + Visibility */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Tags
                            </label>
                            <TagInput
                                value={state.tags}
                                onChange={(tags) =>
                                    dispatch({
                                        type: "SET_FIELD",
                                        field: "tags",
                                        value: tags,
                                    })
                                }
                                suggestions={tagSuggestions}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Visibility
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_FIELD",
                                            field: "visibility",
                                            value: "public",
                                        })
                                    }
                                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                                        state.visibility === "public"
                                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-700"
                                            : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_FIELD",
                                            field: "visibility",
                                            value: "internal",
                                        })
                                    }
                                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                                        state.visibility === "internal"
                                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
                                            : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    Internal
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                        {/* Toolbar + Mode Toggle */}
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex-1">
                                {editorMode === "richtext" && (
                                    <BlogEditorToolbar editor={editor} />
                                )}
                                {editorMode === "markdown" && (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                        Markdown mode — write raw markdown below
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleMode}
                                className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                            >
                                {editorMode === "richtext" ? (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                        Markdown
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Rich Text
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Image upload button (only in rich text mode) */}
                        {editorMode === "richtext" && (
                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                                <button
                                    type="button"
                                    onClick={handleEditorImageUpload}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    Insert Image
                                </button>
                            </div>
                        )}

                        {/* Editor content or Markdown textarea */}
                        {editorMode === "richtext" ? (
                            <EditorContent editor={editor} />
                        ) : (
                            <textarea
                                value={markdownSource}
                                onChange={(e) => setMarkdownSource(e.target.value)}
                                className="blog-markdown-textarea"
                                placeholder="Write your content in markdown..."
                                spellCheck={false}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Recursively walks a TipTap JSON content tree, replacing image `src` values
 * that match blob: URLs with their real R2-hosted URLs.
 */
function replaceBlobUrls(
    node: Record<string, unknown>,
    replacements: Map<string, string>
): Record<string, unknown> {
    const result = { ...node };

    // Replace src on image nodes
    if (result.type === "image" && typeof result.attrs === "object" && result.attrs) {
        const attrs = { ...(result.attrs as Record<string, unknown>) };
        if (typeof attrs.src === "string" && replacements.has(attrs.src)) {
            attrs.src = replacements.get(attrs.src);
        }
        result.attrs = attrs;
    }

    // Recurse into child content
    if (Array.isArray(result.content)) {
        result.content = (result.content as Record<string, unknown>[]).map(
            (child) => replaceBlobUrls(child, replacements)
        );
    }

    return result;
}
