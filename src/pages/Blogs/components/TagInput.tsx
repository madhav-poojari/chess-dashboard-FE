import { useState, useCallback } from "react";

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
}

export default function TagInput({
    value,
    onChange,
    suggestions = [],
    placeholder = "Add a tag...",
}: TagInputProps) {
    const [input, setInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = suggestions.filter(
        (s) =>
            s.toLowerCase().includes(input.toLowerCase()) &&
            !value.includes(s)
    );

    const addTag = useCallback(
        (tag: string) => {
            const trimmed = tag.trim();
            if (trimmed && !value.includes(trimmed)) {
                onChange([...value, trimmed]);
            }
            setInput("");
            setShowSuggestions(false);
        },
        [value, onChange]
    );

    const removeTag = useCallback(
        (index: number) => {
            onChange(value.filter((_, i) => i !== index));
        },
        [value, onChange]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (input.trim()) {
                addTag(input);
            }
        } else if (e.key === "Backspace" && !input && value.length > 0) {
            removeTag(value.length - 1);
        }
    };

    return (
        <div className="relative">
            <div className="flex flex-wrap items-center gap-2 p-2 min-h-[42px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-colors">
                {value.map((tag, index) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
                        >
                            <svg
                                className="w-3 h-3"
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
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder={value.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                />
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && input && filteredSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 max-h-40 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    {filteredSuggestions.slice(0, 8).map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => addTag(suggestion)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
