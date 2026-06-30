import { useEffect, useRef, useState } from "react";
import { Network, DataSet } from "vis-network/standalone";
import { GraphData, GraphNode as IGraphNode, GraphEdge as IGraphEdge } from "../../api/admin/referralGraph.dto";
import { VIS_GRAPH_OPTIONS, getStateColor } from "../../constants/referralGraphConstants";
import NodeHoverPopup from "./NodeHoverPopup";
import EdgeHoverPopup from "./EdgeHoverPopup";

interface GraphProps {
    data: GraphData;
    selectedNodeId?: string | null;
    selectedEdgeId?: string | null;
    onNodeClick: (nodeId: string) => void;
    onEdgeClick: (edgeId: string) => void;
}

interface HoverPopup {
    type: "node" | "edge";
    id: string;
    x: number;
    y: number;
}

interface ClickEvent {
    nodes: string[];
    edges: string[];
    event: MouseEvent;
}

interface HoverNodeEvent {
    node: string;
    event: MouseEvent;
}

interface HoverEdgeEvent {
    edge: string;
    event: MouseEvent;
}

interface GraphTheme {
    nodeBorder: string;
    nodeBorderSelected: string;
    nodeLabel: string;
    edgeColor: string;
    edgeColorSelected: string;
    edgeLabel: string;
}

// Reads the --graph-* custom properties defined in index.css. These resolve
// to whatever is active for :root vs .dark at call time, so re-running this
// after a theme toggle is enough to re-theme the canvas — no hardcoded hex.
function readGraphTheme(): GraphTheme {
    const styles = getComputedStyle(document.documentElement);
    const read = (name: string) => styles.getPropertyValue(name).trim();

    return {
        nodeBorder: read("--graph-node-border"),
        nodeBorderSelected: read("--graph-node-border-selected"),
        nodeLabel: read("--graph-node-label"),
        edgeColor: read("--graph-edge-color"),
        edgeColorSelected: read("--graph-edge-color-selected"),
        edgeLabel: read("--graph-edge-label"),
    };
}

export default function Graph({
    data,
    selectedNodeId,
    selectedEdgeId,
    onNodeClick,
    onEdgeClick,
}: GraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);
    const [hoveredPopup, setHoveredPopup] = useState<HoverPopup | null>(null);

    // Bumped whenever the `dark` class on <html> changes, to trigger a
    // re-read of the CSS vars and a network rebuild with the new theme.
    const [themeVersion, setThemeVersion] = useState(0);

    useEffect(() => {
        const root = document.documentElement;
        const observer = new MutationObserver(() => {
            setThemeVersion((v) => v + 1);
        });
        observer.observe(root, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const theme = readGraphTheme();

        // creating anchor nodes to cluster by state
        const uniqueStates = [...new Set(data.nodes.map((n: IGraphNode) => n.state ?? ''))];

        const anchorRadius = 350;
        const anchorNodes = uniqueStates.map((state, index) => {
            const angle = (index / uniqueStates.length) * 2 * Math.PI;
            return {
                id: `anchor-${state}`,
                x: anchorRadius * Math.cos(angle),
                y: anchorRadius * Math.sin(angle),
                fixed: true,
                hidden: true,
                size: 0.1,
                label: '',
                color: { opacity: 0 } as any,
                isAnchor: true,
            };
        });

        const visNodes = new DataSet([
            ...data.nodes.map((node: IGraphNode) => ({
                id: node.id,
                label: node.name,
                state: node.state,
                title: `${node.name} (${node.state})`,
                color: {
                    background: getStateColor(node.state),
                    border: selectedNodeId === node.id ? theme.nodeBorderSelected : theme.nodeBorder,
                    highlight: {
                        background: getStateColor(node.state),
                        border: theme.nodeBorderSelected,
                    },
                },
                borderWidth: selectedNodeId === node.id ? 3 : 2,
                font: { size: 14, color: theme.nodeLabel },
                shape: "dot",
                size: 25,
            })),
            ...anchorNodes
        ]);

        const anchorEdges = data.nodes.flatMap((node: IGraphNode) => [
            {
                id: `anchor-edge-${node.id}`,
                from: node.id,
                to: `anchor-${node.state}`,
                hidden: true,
                physics: true,
                length: 80,
                color: { opacity: 0 },
                smooth: false,
                arrows: { to: { enabled: false } },
            }
        ]);

        const visEdges = new DataSet([
            ...data.edges.map((edge: IGraphEdge) => ({
                id: edge.id,
                from: edge.source,
                to: edge.target,
                title: edge.relationship_type,
                label: edge.relationship_type,
                color: {
                    color: selectedEdgeId === edge.id ? theme.edgeColorSelected : theme.edgeColor,
                    highlight: theme.edgeColorSelected,
                },
                width: selectedEdgeId === edge.id ? 3 : 1.5,
                arrows: "to", // inherits color.color above; no separate arrow token needed
                smooth: { enabled: true, type: "continuous", roundness: 0.5 },
                font: { size: 12, color: theme.edgeLabel, align: "middle" },
            })),
            ...anchorEdges
        ]);

        const network = new Network(
            containerRef.current,
            { nodes: visNodes, edges: visEdges },
            {
                ...VIS_GRAPH_OPTIONS,
                physics: {
                    enabled: true,
                    solver: "forceAtlas2Based",
                    forceAtlas2Based: {
                        gravitationalConstant: -70,
                        centralGravity: 0.005,
                        springLength: 100,
                        springConstant: 0.08,
                    },
                    stabilization: {
                        enabled: true,
                        iterations: 1000,
                        updateInterval: 25,
                    }
                }
            }
        );

        network.on("click", (params: ClickEvent) => {
            if (params.nodes && params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                if (typeof nodeId === 'string' && nodeId.startsWith('anchor-')) {
                    return;
                }
                setHoveredPopup(null);
                onNodeClick(nodeId);
            } else if (params.edges && params.edges.length > 0) {
                onEdgeClick(params.edges[0]);
            }
        });

        network.on("hoverNode", (params: HoverNodeEvent) => {
            if (params.node.startsWith('anchor-')) {
                setHoveredPopup(null);
                return;
            }

            const node = data.nodes.find((n) => n.id === params.node);
            if (node) {
                const pos = network.getPositions([params.node])[params.node];
                const canvasPos = network.canvasToDOM({ x: pos.x, y: pos.y });
                setHoveredPopup({
                    type: "node",
                    id: params.node,
                    x: canvasPos.x,
                    y: canvasPos.y,
                });
            }
        });

        network.on("blurNode", () => setHoveredPopup(null));

        network.on("hoverEdge", (params: HoverEdgeEvent) => {
            const edge = visEdges.get(params.edge);
            if (edge && edge.to && typeof edge.to === 'string' && edge.to.startsWith('anchor-')) {
                return;
            }

            const originalEdge = data.edges.find((e) => e.id === params.edge);
            if (originalEdge) {
                setHoveredPopup({
                    type: "edge",
                    id: params.edge,
                    x: params.event.clientX,
                    y: params.event.clientY,
                });
            }
        });

        network.on("blurEdge", () => setHoveredPopup(null));

        networkRef.current = network;

        return () => {
            network.destroy();
            networkRef.current = null;
        };
    }, [data, selectedNodeId, selectedEdgeId, onNodeClick, onEdgeClick, themeVersion]);

    return (
        <div className="relative w-full h-full">
            <div
                ref={containerRef}
                className="w-full h-full bg-gradient-to-br
                           from-brand-25 via-blue-light-25 to-gray-50
                           dark:from-gray-900 dark:via-gray-950 dark:to-gray-900
                           transition-colors"
            />

            {hoveredPopup && (
                <div
                    className="absolute pointer-events-none z-99 animate-in fade-in zoom-in-95 duration-150"
                    style={{ left: `${hoveredPopup.x + 10}px`, top: `${hoveredPopup.y + 10}px` }}
                >
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800
                                    bg-white/95 dark:bg-gray-dark/95 backdrop-blur-md
                                    shadow-theme-lg overflow-hidden">
                        {hoveredPopup.type === "node" && (
                            <NodeHoverPopup nodeId={hoveredPopup.id} data={data} />
                        )}
                        {hoveredPopup.type === "edge" && (
                            <EdgeHoverPopup edgeId={hoveredPopup.id} data={data} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}