import { GraphData } from "../../api/admin/referralGraph.dto";
import { RELATIONSHIP_TYPE_LABELS } from "../../constants/referralGraphConstants";

interface EdgeHoverPopupProps {
    edgeId: string;
    data: GraphData;
}

export default function EdgeHoverPopup({ edgeId, data }: EdgeHoverPopupProps) {
    const edge = data.edges.find((e) => e.id === edgeId);
    if (!edge) return null;

    const referrer = data.nodes.find((n) => n.id === edge.source);
    const referee = data.nodes.find((n) => n.id === edge.target);

    if (!referrer || !referee) return null;

    const typeLabel = RELATIONSHIP_TYPE_LABELS[edge.relationship_type] || edge.relationship_type;

    return (
        <div className="bg-white rounded-lg shadow-xl p-4 min-w-max z-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-gray-900">{referrer.name}</span>
                <span className="text-blue-600 font-bold">ΓåÆ</span>
                <span className="font-semibold text-gray-900">{referee.name}</span>
            </div>

            <div className="space-y-2 text-sm border-t pt-3">
                <div>
                    <span className="text-gray-600">Type:</span> <span className="font-medium">{typeLabel}</span>
                </div>

                {edge.relationship_description && (
                    <div>
                        <span className="text-gray-600">Note:</span>{" "}
                        <span className="font-medium">{edge.relationship_description}</span>
                    </div>
                )}

                <div>
                    <span className="text-gray-600">Date:</span>{" "}
                    <span className="font-medium">{new Date(edge.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">Click to edit or delete</p>
        </div>
    );
}
