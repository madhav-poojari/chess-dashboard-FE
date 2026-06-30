import { useNodeDetail } from "../../hooks/useNodeDetail";

interface SidePanelProps {
    nodeId: string;
    onClose: () => void;
}

export default function SidePanel({ nodeId, onClose }: SidePanelProps) {
    const { data: nodeDetail, isLoading, isError, error } = useNodeDetail(nodeId);

    return (
        <div className="flex h-full w-96 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Profile
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Member information and referral relationships.
                        </p>
                    </div>
    
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            </div>
    
            {/* Body */}
            <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
                {isLoading && (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                Loading profile...
                            </p>
                        </div>
                    </div>
                )}
    
                {isError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <p className="font-semibold text-red-600 dark:text-red-400">
                            Error loading profile
                        </p>
                        <p className="mt-2 text-sm text-red-500">
                            {error?.message}
                        </p>
                    </div>
                )}
    
                {nodeDetail && (
                    <div className="space-y-8">
                        {/* Profile */}
                        <div className="text-center">
                            {nodeDetail.profile_picture_url ? (
                                <img
                                    src={nodeDetail.profile_picture_url}
                                    alt={nodeDetail.full_name}
                                    className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-gray-200 object-cover dark:border-gray-700"
                                />
                            ) : (
                                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {nodeDetail.full_name.charAt(0)}
                                </div>
                            )}
    
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {nodeDetail.full_name}
                            </h3>
    
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                @{nodeDetail.user_id}
                            </p>
                        </div>
    
                        {/* Contact */}
                        <section>
                            <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                Contact Information
                            </h4>
    
                            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Email
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {nodeDetail.email}
                                    </p>
                                </div>
    
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Location
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {nodeDetail.city}, {nodeDetail.state}, {nodeDetail.country}
                                    </p>
                                </div>
    
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Role
                                    </p>
                                    <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium capitalize text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {nodeDetail.role}
                                    </span>
                                </div>
                            </div>
                        </section>
    
                        {/* About */}
                        {nodeDetail.bio && (
                            <section>
                                <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                    About
                                </h4>
    
                                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
                                    <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                                        {nodeDetail.bio}
                                    </p>
                                </div>
                            </section>
                        )}
                                            {/* Chess Profiles */}
                    <section>
                        <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                            Chess Profiles
                        </h4>

                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
                            {nodeDetail.uscf_id && (
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        USCF ID
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {nodeDetail.uscf_id}
                                    </p>
                                </div>
                            )}

                            {nodeDetail.lichess_username && (
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Lichess
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {nodeDetail.lichess_username}
                                    </p>
                                </div>
                            )}

                            {nodeDetail.chesscom_username && (
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Chess.com
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {nodeDetail.chesscom_username}
                                    </p>
                                </div>
                            )}

                            {!nodeDetail.uscf_id &&
                                !nodeDetail.lichess_username &&
                                !nodeDetail.chesscom_username && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No chess profiles available.
                                    </p>
                                )}
                        </div>
                    </section>

                    {/* Meeting */}
                    {nodeDetail.personal_meet_link && (
                        <section>
                            <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                Meeting
                            </h4>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
                                <a
                                    href={nodeDetail.personal_meet_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400"
                                >
                                    Join Meeting
                                </a>
                            </div>
                        </section>
                    )}

                    {/* Referred By */}
                    {nodeDetail.referred_by.length > 0 && (
                        <section>
                            <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                Referred By ({nodeDetail.referred_by.length})
                            </h4>

                            <div className="space-y-3">
                                {nodeDetail.referred_by.map((ref) => (
                                    <div
                                        key={ref.user_id}
                                        className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {ref.name}
                                            </p>

                                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-800/40 dark:text-blue-300">
                                                {ref.relationship_type}
                                            </span>
                                        </div>

                                        {ref.relationship_description && (
                                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                                {ref.relationship_description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Referred To */}
                    {nodeDetail.referred_to.length > 0 && (
                        <section>
                            <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                Referred To ({nodeDetail.referred_to.length})
                            </h4>

                            <div className="space-y-3">
                                {nodeDetail.referred_to.map((ref) => (
                                    <div
                                        key={ref.user_id}
                                        className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {ref.name}
                                            </p>

                                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-800/40 dark:text-green-300">
                                                {ref.relationship_type}
                                            </span>
                                        </div>

                                        {ref.relationship_description && (
                                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                                {ref.relationship_description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    </div>
);
}
