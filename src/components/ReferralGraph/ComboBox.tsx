import { useState, useRef, useEffect } from "react";

interface ComboboxProps {
    label?: string;
    options: any[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    displayField?: string;
    idField?: string;
    formatOption?: (option: any) => string;
}

export function Combobox({
    label,
    options,
    value,
    onChange,
    placeholder = "Search...",
    displayField = "name",
    idField = "id",
    formatOption = (opt) => opt[displayField],
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = options.filter((opt) =>
        formatOption(opt).toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find((opt) => opt[idField] === value);

    useEffect(() => {
        if (!isOpen && selectedOption) {
            setSearch(formatOption(selectedOption));
        } else if (!isOpen) {
            setSearch("");
        }
    }, [isOpen, selectedOption]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setHighlightedIndex(0);
    }, [search]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setIsOpen(true);
        if (value) onChange("");
    };

    const handleSelect = (option: any) => {
        onChange(option[idField]);
        setSearch(formatOption(option));
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "Enter") setIsOpen(true);
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((i) => (i + 1) % filtered.length);
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((i) => (i - 1 + filtered.length) % filtered.length);
                break;
            case "Enter":
                e.preventDefault();
                if (filtered[highlightedIndex]) {
                    handleSelect(filtered[highlightedIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
    
            <input
                ref={inputRef}
                type="text"
                value={isOpen ? search : selectedOption ? formatOption(selectedOption) : ""}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                className="
                    w-full rounded-xl border border-gray-300
                    bg-white px-4 py-3
                    text-sm text-gray-900
                    placeholder:text-gray-400
                    transition
                    outline-none
                    focus:border-blue-500
                    focus:ring-3 focus:ring-blue-500/10
    
                    dark:border-gray-700
                    dark:bg-gray-800
                    dark:text-white
                    dark:placeholder:text-gray-500
                    dark:focus:border-blue-500
                    dark:focus:ring-blue-500/10
                "
            />
    
            {isOpen && (
                <ul
                    role="listbox"
                    className="
                        custom-scrollbar
                        absolute z-50 mt-2
                        max-h-64 w-full overflow-y-auto
                        rounded-xl border border-gray-200
                        bg-white
                        py-2
                        shadow-xl
    
                        dark:border-gray-700
                        dark:bg-gray-800
                    "
                >
                    {filtered.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No results found
                        </li>
                    ) : (
                        filtered.map((opt, idx) => (
                            <li
                                key={opt[idField]}
                                role="option"
                                aria-selected={opt[idField] === value}
                                onClick={() => handleSelect(opt)}
                                className={`
                                    cursor-pointer px-4 py-3 text-sm transition-colors
    
                                    ${
                                        idx === highlightedIndex
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                    }
    
                                    ${
                                        opt[idField] === value
                                            ? "font-semibold"
                                            : ""
                                    }
                                `}
                            >
                                {formatOption(opt)}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
