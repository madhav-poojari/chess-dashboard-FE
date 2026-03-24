// src/components/UserProfile/tournaments/TournamentCard.tsx
import { Tournament } from "../../../api/user/tournamentService";

interface TournamentCardProps {
    tournament: Tournament;
    selected?: boolean;
    onToggleSelect?: (id: number) => void;
}

export default function TournamentCard({ tournament, selected, onToggleSelect }: TournamentCardProps) {
    const formattedDate = tournament.start_date
        ? new Date(tournament.start_date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : tournament.dates || "Date TBD";

    const tournamentUrl = tournament.url_path
        ? `https://new.uschess.org${tournament.url_path}`
        : null;

    return (
        <div
            className={`rounded-xl border p-5 transition-all hover:shadow-md ${selected
                    ? "border-blue-400 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-900/10"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03]"
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                {onToggleSelect && (
                    <label className="mt-0.5 flex shrink-0 cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => onToggleSelect(tournament.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 cursor-pointer"
                        />
                    </label>
                )}

                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                            {tournamentUrl ? (
                                <a
                                    href={tournamentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-base font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 line-clamp-2"
                                >
                                    {tournament.title}
                                </a>
                            ) : (
                                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 line-clamp-2">
                                    {tournament.title}
                                </h4>
                            )}
                        </div>
                    </div>

                    {/* Info row */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                        {/* Date */}
                        <div className="flex items-center gap-1.5">
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formattedDate}</span>
                        </div>

                        {/* Location */}
                        {(tournament.city || tournament.state) && (
                            <div className="flex items-center gap-1.5">
                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>
                                    {[tournament.city, tournament.state].filter(Boolean).join(", ")}
                                </span>
                            </div>
                        )}

                        {/* Organizer */}
                        {tournament.organizer && (
                            <div className="flex items-center gap-1.5">
                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{tournament.organizer}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {tournament.description && (
                        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
                            {tournament.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
