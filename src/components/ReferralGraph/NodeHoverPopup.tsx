import { GraphData } from "../../api/admin/referralGraph.dto";

interface NodeHoverPopupProps {
    nodeId: string;
    data: GraphData;
}

export default function NodeHoverPopup({ nodeId, data }: NodeHoverPopupProps) {
    const node = data.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    // Count referrals
    const referralsMade = data.edges.filter((e) => e.source === nodeId).length;
    const referralsReceived = data.edges.filter((e) => e.target === nodeId).length;

    return (
        <div className="bg-white rounded-lg shadow-xl p-4 min-w-max z-50 border border-gray-200">
            <h3 className="font-semibold text-gray-900">{node.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{node.state}</p>

            <div className="space-y-2 text-sm">
                <div>
                    <span className="text-gray-600">Role:</span> <span className="font-medium">{node.role}</span>
                </div>
                <div>
                    <span className="text-gray-600">Referred:</span>{" "}
                    <span className="font-medium">{referralsMade}</span>
                </div>
                <div>
                    <span className="text-gray-600">Referred by:</span>{" "}
                    <span className="font-medium">{referralsReceived}</span>
                </div>
            </div>

            {node.profile_picture_url && (
                <img
                    src={node.profile_picture_url}
                    alt={node.name}
                    className="mt-3 w-8 h-8 rounded-full"
                />
            )}

            <p className="text-xs text-gray-500 mt-3">Click to see full details</p>
        </div>
    );
}
