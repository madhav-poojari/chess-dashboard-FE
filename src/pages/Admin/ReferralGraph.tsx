import { useState, useCallback } from "react";
import { useReferralGraph } from "../../hooks/useReferralGraph";
import RequireRole from "../../components/auth/RequireRole";
import PageMeta from "../../components/common/PageMeta";
import Graph from "../../components/ReferralGraph/Graph";
import AddRelationshipModal from "../../components/ReferralGraph/AddRelationshipModal";
import EditRelationshipModal from "../../components/ReferralGraph/EditRelationshipModal";
import SidePanel from "../../components/ReferralGraph/SidePanel";

export default function ReferralGraph() {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const { data: graphData, isLoading, isError, error, refetch } = useReferralGraph();

    const handleNodeClick = useCallback((nodeId: string) => {
        console.log("handleNodeClick called with nodeId:", nodeId);
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
        setShowEditModal(false);
    }, []);

    const handleEdgeClick = useCallback((edgeId: string) => {
        console.log("handleEdgeClick called with edgeId:", edgeId);
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
        setShowEditModal(true);
    }, []);

    const handleAddRelationship = useCallback(() => {
        setShowAddModal(true);
    }, []);

    const handleCloseAddModal = useCallback(() => {
        setShowAddModal(false);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        setShowEditModal(false);
        setSelectedEdgeId(null);
    }, []);

    const selectedNode = graphData?.nodes.find((n) => n.id === selectedNodeId);
    const selectedEdge = graphData?.edges.find((e) => e.id === selectedEdgeId);
    return (< RequireRole allowedRoles={["admin"]} >
        <div className="flex flex-col h-screen bg-gray-100">
            <PageMeta title="Referral Graph" description="Visualize referral network relationships" />
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Referral Network</h1>
                        <p className="text-gray-600 mt-1">Visualize and manage referral relationships</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleAddRelationship}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            + Add Relationship
                        </button>
                        <button
                            onClick={() => refetch()}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {graphData && (
                    <div className="flex gap-8 mt-6">
                        <div>
                            <p className="text-gray-600 text-sm">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{graphData.metadata.total_nodes}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Total Relationships</p>
                            <p className="text-2xl font-bold text-gray-900">{graphData.metadata.total_edges}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Graph Panel */}
                <div className="flex-1 relative bg-white">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-gray-700">Loading graph...</p>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <div className="text-center">
                                <div className="text-red-600 text-lg font-semibold">Error loading graph</div>
                                <p className="text-gray-600 mt-2">{error?.message}</p>
                                <button
                                    onClick={() => refetch()}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {!isLoading && !isError && graphData && (
                        <Graph
                            data={graphData}
                            selectedNodeId={selectedNodeId}
                            selectedEdgeId={selectedEdgeId}
                            onNodeClick={handleNodeClick}
                            onEdgeClick={handleEdgeClick}
                        />
                    )}
                </div>

                {/* Side Panel */}
                {selectedNodeId && (
                    <SidePanel
                        nodeId={selectedNodeId}
                        onClose={() => setSelectedNodeId(null)}
                    />
                )}
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddRelationshipModal
                    onClose={handleCloseAddModal}
                    onSuccess={() => {
                        handleCloseAddModal();
                        refetch();
                    }}
                />
            )}

            {showEditModal && selectedEdge && (
                <EditRelationshipModal
                    relationshipId={selectedEdge.id}
                    relationshipType={selectedEdge.relationship_type}
                    relationshipDescription={selectedEdge.relationship_description}
                    onClose={handleCloseEditModal}
                    onSuccess={() => {
                        handleCloseEditModal();
                        refetch();
                    }}
                />
            )}
        </div>
    </RequireRole >);
}