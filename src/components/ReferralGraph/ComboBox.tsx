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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
            />
            {/* Dropdown */}
            {isOpen && (
                <ul
                    className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg"
                    role="listbox"
                >
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-500">No results found</li>
                    ) : (
                        filtered.map((opt, idx) => (
                            <li
                                key={opt[idField]}
                                onClick={() => handleSelect(opt)}
                                className={`px-3 py-2 cursor-pointer text-sm ${idx === highlightedIndex
                                    ? "bg-blue-50 text-blue-900"
                                    : "hover:bg-gray-50 text-gray-900"
                                    } ${opt[idField] === value ? "font-semibold bg-blue-50" : ""}`}
                                role="option"
                                aria-selected={opt[idField] === value}
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
