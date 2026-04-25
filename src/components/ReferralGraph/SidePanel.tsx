import { useNodeDetail } from "../../hooks/useNodeDetail";

interface SidePanelProps {
    nodeId: string;
    onClose: () => void;
}

export default function SidePanel({ nodeId, onClose }: SidePanelProps) {
    const { data: nodeDetail, isLoading, isError, error } = useNodeDetail(nodeId);

    return (
        <div className="w-96 bg-white border-l border-gray-200 shadow-lg overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Profile</h2>
                <button
                    onClick={onClose}
                    className="text-white hover:bg-blue-800 p-1 rounded-lg transition"
                >
                    Γ£ò
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-700 text-sm">Loading...</p>
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="p-6 text-center">
                        <p className="text-red-600 font-semibold">Error loading profile</p>
                        <p className="text-sm text-gray-600 mt-2">{error?.message}</p>
                    </div>
                )}

                {nodeDetail && (
                    <div className="p-6 space-y-6">
                        {/* Profile Picture & Name */}
                        <div className="text-center">
                            {nodeDetail.profile_picture_url && (
                                <img
                                    src={nodeDetail.profile_picture_url}
                                    alt={nodeDetail.full_name}
                                    className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-blue-200"
                                />
                            )}
                            <h3 className="text-2xl font-bold text-gray-900">{nodeDetail.full_name}</h3>
                            <p className="text-gray-600">@{nodeDetail.user_id}</p>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div>
                                <p className="text-xs text-gray-600 uppercase font-semibold">Email</p>
                                <p className="text-gray-900">{nodeDetail.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 uppercase font-semibold">Location</p>
                                <p className="text-gray-900">
                                    {nodeDetail.city}, {nodeDetail.state}, {nodeDetail.country}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 uppercase font-semibold">Role</p>
                                <p className="text-gray-900 capitalize">{nodeDetail.role}</p>
                            </div>
                        </div>

                        {/* Bio */}
                        {nodeDetail.bio && (
                            <div>
                                <p className="text-xs text-gray-600 uppercase font-semibold mb-2">About</p>
                                <p className="text-gray-700">{nodeDetail.bio}</p>
                            </div>
                        )}

                        {/* Chess Info */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-3">Chess Profiles</p>
                            {nodeDetail.uscf_id && (
                                <p className="text-sm">
                                    <span className="text-gray-600">USCF ID:</span> <span className="font-medium">{nodeDetail.uscf_id}</span>
                                </p>
                            )}
                            {nodeDetail.lichess_username && (
                                <p className="text-sm">
                                    <span className="text-gray-600">Lichess:</span>{" "}
                                    <span className="font-medium">{nodeDetail.lichess_username}</span>
                                </p>
                            )}
                            {nodeDetail.chesscom_username && (
                                <p className="text-sm">
                                    <span className="text-gray-600">Chess.com:</span>{" "}
                                    <span className="font-medium">{nodeDetail.chesscom_username}</span>
                                </p>
                            )}
                        </div>

                        {/* Meet Link */}
                        {nodeDetail.personal_meet_link && (
                            <div>
                                <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Meet</p>
                                <a
                                    href={nodeDetail.personal_meet_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all text-sm"
                                >
                                    Join Meeting
                                </a>
                            </div>
                        )}

                        {/* Referred By */}
                        {nodeDetail.referred_by.length > 0 && (
                            <div className="border-t pt-4">
                                <p className="text-xs text-gray-600 uppercase font-semibold mb-3">
                                    Referred By ({nodeDetail.referred_by.length})
                                </p>
                                <div className="space-y-2">
                                    {nodeDetail.referred_by.map((ref) => (
                                        <div key={ref.user_id} className="bg-blue-50 rounded p-2">
                                            <p className="font-medium text-gray-900">{ref.name}</p>
                                            <p className="text-xs text-gray-600">{ref.relationship_type}</p>
                                            {ref.relationship_description && (
                                                <p className="text-xs text-gray-500 mt-1">{ref.relationship_description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Referred To */}
                        {nodeDetail.referred_to.length > 0 && (
                            <div className="border-t pt-4">
                                <p className="text-xs text-gray-600 uppercase font-semibold mb-3">
                                    Referred To ({nodeDetail.referred_to.length})
                                </p>
                                <div className="space-y-2">
                                    {nodeDetail.referred_to.map((ref) => (
                                        <div key={ref.user_id} className="bg-green-50 rounded p-2">
                                            <p className="font-medium text-gray-900">{ref.name}</p>
                                            <p className="text-xs text-gray-600">{ref.relationship_type}</p>
                                            {ref.relationship_description && (
                                                <p className="text-xs text-gray-500 mt-1">{ref.relationship_description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
