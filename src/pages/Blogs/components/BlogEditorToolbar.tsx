import type { Editor } from "@tiptap/react";

interface BlogEditorToolbarProps {
    editor: Editor | null;
}

interface ToolbarButton {
    label: string;
    icon: React.ReactNode;
    action: () => void;
    isActive?: boolean;
}

export default function BlogEditorToolbar({ editor }: BlogEditorToolbarProps) {
    if (!editor) return null;

    const groups: ToolbarButton[][] = [
        // Text formatting
        [
            {
                label: "Bold",
                icon: <span className="font-bold">B</span>,
                action: () => editor.chain().focus().toggleBold().run(),
                isActive: editor.isActive("bold"),
            },
            {
                label: "Italic",
                icon: <span className="italic">I</span>,
                action: () => editor.chain().focus().toggleItalic().run(),
                isActive: editor.isActive("italic"),
            },
            {
                label: "Underline",
                icon: <span className="underline">U</span>,
                action: () => editor.chain().focus().toggleUnderline().run(),
                isActive: editor.isActive("underline"),
            },
            {
                label: "Strikethrough",
                icon: <span className="line-through">S</span>,
                action: () => editor.chain().focus().toggleStrike().run(),
                isActive: editor.isActive("strike"),
            },
        ],
        // Headings
        [
            {
                label: "Heading 1",
                icon: <span className="text-sm font-bold">H1</span>,
                action: () =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run(),
                isActive: editor.isActive("heading", { level: 1 }),
            },
            {
                label: "Heading 2",
                icon: <span className="text-sm font-bold">H2</span>,
                action: () =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run(),
                isActive: editor.isActive("heading", { level: 2 }),
            },
            {
                label: "Heading 3",
                icon: <span className="text-sm font-bold">H3</span>,
                action: () =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run(),
                isActive: editor.isActive("heading", { level: 3 }),
            },
        ],
        // Lists
        [
            {
                label: "Bullet List",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                ),
                action: () => editor.chain().focus().toggleBulletList().run(),
                isActive: editor.isActive("bulletList"),
            },
            {
                label: "Ordered List",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
                    </svg>
                ),
                action: () => editor.chain().focus().toggleOrderedList().run(),
                isActive: editor.isActive("orderedList"),
            },
        ],
        // Block elements
        [
            {
                label: "Blockquote",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                ),
                action: () => editor.chain().focus().toggleBlockquote().run(),
                isActive: editor.isActive("blockquote"),
            },
            {
                label: "Code Block",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                ),
                action: () => editor.chain().focus().toggleCodeBlock().run(),
                isActive: editor.isActive("codeBlock"),
            },
            {
                label: "Horizontal Rule",
                icon: <span className="text-sm">—</span>,
                action: () => editor.chain().focus().setHorizontalRule().run(),
            },
        ],
        // Alignment
        [
            {
                label: "Align Left",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                    </svg>
                ),
                action: () => editor.chain().focus().setTextAlign("left").run(),
                isActive: editor.isActive({ textAlign: "left" }),
            },
            {
                label: "Align Center",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                    </svg>
                ),
                action: () => editor.chain().focus().setTextAlign("center").run(),
                isActive: editor.isActive({ textAlign: "center" }),
            },
            {
                label: "Align Right",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                    </svg>
                ),
                action: () => editor.chain().focus().setTextAlign("right").run(),
                isActive: editor.isActive({ textAlign: "right" }),
            },
        ],
        // Link
        [
            {
                label: "Link",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                ),
                action: () => {
                    const previousUrl = editor.getAttributes("link").href;
                    const url = window.prompt("Enter URL:", previousUrl || "https://");
                    if (url === null) return; // cancelled
                    if (url === "") {
                        editor.chain().focus().extendMarkRange("link").unsetLink().run();
                        return;
                    }
                    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
                },
                isActive: editor.isActive("link"),
            },
        ],
        // Undo/Redo
        [
            {
                label: "Undo",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                ),
                action: () => editor.chain().focus().undo().run(),
            },
            {
                label: "Redo",
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                    </svg>
                ),
                action: () => editor.chain().focus().redo().run(),
            },
        ],
    ];

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800/50">
            {groups.map((group, gi) => (
                <div key={gi} className="flex items-center gap-0.5">
                    {group.map((btn) => (
                        <button
                            key={btn.label}
                            type="button"
                            onClick={btn.action}
                            title={btn.label}
                            className={`p-1.5 rounded-md transition-colors text-sm leading-none ${
                                btn.isActive
                                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                        >
                            {btn.icon}
                        </button>
                    ))}
                    {gi < groups.length - 1 && (
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    )}
                </div>
            ))}
        </div>
    );
}
