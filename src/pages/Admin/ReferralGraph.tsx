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

    //const selectedNode = graphData?.nodes.find((n) => n.id === selectedNodeId);
    const selectedEdge = graphData?.edges.find((e) => e.id === selectedEdgeId);
    return (
        <RequireRole allowedRoles={["admin"]}>
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                <PageMeta title="Referral Graph" description="Visualize referral network relationships" />
    
                {/* Header */}
                <div className="bg-white dark:bg-gray-dark border-b border-gray-200 dark:border-gray-800
                                px-8 py-6 sticky top-0 z-9">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                                Referral Network
                            </h1>
                            <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                                Visualize and manage referral relationships
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddRelationship}
                                className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 bg-brand-50 dark:bg-brand-500/10 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20
                                           active:scale-[0.98] transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 1v12M1 7h12" strokeLinecap="round" />
                </svg>
                                Add Relationship
                            </button>
                            <button
                                onClick={() => refetch()}
                                className="px-4 py-2.5 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300
                                           text-theme-sm font-medium rounded-lg border border-gray-200 dark:border-gray-800
                                           hover:bg-gray-50 dark:hover:bg-white/[0.08]
                                           active:scale-[0.98] transition-all"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
    
                    {/* Stats */}
                    {graphData && (
                        <div className="flex gap-3 mt-5">
                            <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03]
                                            rounded-lg border border-gray-100 dark:border-gray-800">
                                <p className="text-theme-xs font-medium uppercase tracking-wide
                                              text-gray-500 dark:text-gray-400">
                                    Total Users
                                </p>
                                <p className="text-theme-xl font-semibold text-gray-800 dark:text-white/90 mt-0.5">
                                    {graphData.metadata.total_nodes}
                                </p>
                            </div>
                            <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03]
                                            rounded-lg border border-gray-100 dark:border-gray-800">
                                <p className="text-theme-xs font-medium uppercase tracking-wide
                                              text-gray-500 dark:text-gray-400">
                                    Total Relationships
                                </p>
                                <p className="text-theme-xl font-semibold text-gray-800 dark:text-white/90 mt-0.5">
                                    {graphData.metadata.total_edges}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
    
                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Graph Panel */}
                    <div className="flex-1 relative bg-white dark:bg-gray-dark">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center
                                            bg-white/90 dark:bg-gray-dark/90 z-9">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-10 w-10
                                                    border-2 border-gray-200 dark:border-gray-800
                                                    border-t-brand-500"></div>
                                    <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">
                                        Loading graph…
                                    </p>
                                </div>
                            </div>
                        )}
    
                        {isError && (
                            <div className="absolute inset-0 flex items-center justify-center
                                            bg-white/90 dark:bg-gray-dark/90 z-9">
                                <div className="text-center max-w-sm">
                                    <div className="text-error-500 text-theme-sm font-semibold">
                                        Error loading graph
                                    </div>
                                    <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1.5">
                                        {error?.message}
                                    </p>
                                    <button
                                        onClick={() => refetch()}
                                        className="mt-4 px-4 py-2.5 bg-brand-500 text-white text-theme-sm font-medium
                                                   rounded-lg shadow-theme-xs hover:bg-brand-600 transition-all"
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
                        <div className="w-100 border-l border-gray-200 dark:border-gray-800
                                        bg-white dark:bg-gray-dark shadow-theme-lg">
                            <SidePanel
                                nodeId={selectedNodeId}
                                onClose={() => setSelectedNodeId(null)}
                            />
                        </div>
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
        </RequireRole>
    );
}