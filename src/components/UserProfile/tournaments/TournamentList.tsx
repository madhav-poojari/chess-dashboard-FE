// src/components/UserProfile/tournaments/TournamentList.tsx
import { useState, useCallback } from "react";
import { useTournaments } from "../../../hooks/useTournaments";
import { Tournament, TournamentGroup } from "../../../api/user/tournamentService";
import TournamentCard from "./TournamentCard";

interface TournamentListProps {
    userId: string;
}

/** Format a single tournament into the copy-friendly text block */
function formatTournamentForCopy(t: Tournament): string {
    const date = t.start_date
        ? new Date(t.start_date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : t.dates || "Date TBD";

    const location = [t.city, t.state].filter(Boolean).join(", ");
    const url = t.url_path ? `https://new.uschess.org${t.url_path}` : "";

    const lines = [`🏆 ${t.title}`, `📅 ${date}`];
    if (location) lines.push(`📍 ${location}`);
    if (t.organizer) lines.push(`👤 Organizer: ${t.organizer}`);
    if (url) lines.push(`🔗 ${url}`);

    return lines.join("\n");
}

/** Per-distance section with its own selection + copy */
function DistanceSection({ group }: { group: TournamentGroup }) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [copied, setCopied] = useState(false);

    const tournaments = group.tournaments || [];
    const hasAny = tournaments.length > 0;

    const toggleSelect = useCallback((id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds((prev) => {
            if (prev.size === tournaments.length) {
                return new Set();
            }
            return new Set(tournaments.map((t) => t.id));
        });
    }, [tournaments]);

    const handleCopy = useCallback(async () => {
        const selected = tournaments.filter((t) => selectedIds.has(t.id));
        if (selected.length === 0) return;

        const header = `📍 Within ${group.distance} miles\n${"─".repeat(30)}\n\n`;
        const text = header + selected.map(formatTournamentForCopy).join("\n\n");

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error("Failed to copy to clipboard");
        }
    }, [tournaments, selectedIds, group.distance]);

    const allSelected = hasAny && selectedIds.size === tournaments.length;
    const someSelected = selectedIds.size > 0;

    return (
        <div className="mb-6 last:mb-0">
            {/* Section header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <h4 className="text-base font-semibold text-gray-700 dark:text-white/80">
                        Within {group.distance} miles
                    </h4>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${hasAny
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                        {tournaments.length}
                    </span>
                </div>

                {hasAny && (
                    <div className="flex items-center gap-2">
                        {/* Select All */}
                        <button
                            onClick={toggleSelectAll}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <input
                                type="checkbox"
                                checked={allSelected}
                                readOnly
                                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 pointer-events-none dark:border-gray-600"
                            />
                            {allSelected ? "Deselect All" : "Select All"}
                        </button>

                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            disabled={!someSelected}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${someSelected
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                    Copy{someSelected ? ` (${selectedIds.size})` : ""}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Tournament cards or empty state */}
            {hasAny ? (
                <div className="space-y-3">
                    {tournaments.map((tournament) => (
                        <TournamentCard
                            key={tournament.id}
                            tournament={tournament}
                            selected={selectedIds.has(tournament.id)}
                            onToggleSelect={toggleSelect}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic pl-1">
                    No additional tournaments found at this distance.
                </p>
            )}
        </div>
    );
}

export default function TournamentList({ userId }: TournamentListProps) {
    const { data: groups, isLoading, isError } = useTournaments(userId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <p className="text-red-500 dark:text-red-400">
                    Failed to load tournaments. Please try again later.
                </p>
            </div>
        );
    }

    // Check if there are any tournaments across all groups
    const totalTournaments = (groups || []).reduce(
        (sum, g) => sum + (g.tournaments?.length || 0), 0
    );

    if (!groups || totalTournaments === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <svg
                        className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                        No tournaments near this student
                    </h3>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                        Tournaments will appear here once data is available for the
                        student's area.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="flex items-center gap-3 mb-5 lg:mb-7">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Nearby Tournaments
                </h3>
                <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {totalTournaments} total
                </span>
            </div>

            {/* Distance sections */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {groups.map((group) => (
                    <div key={group.distance} className="py-5 first:pt-0 last:pb-0">
                        <DistanceSection group={group} />
                    </div>
                ))}
            </div>
        </div>
    );
}
