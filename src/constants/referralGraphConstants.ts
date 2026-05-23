import { RelationshipType } from "../api/admin/referralGraph.dto";

export const STATE_COLOR_MAP: Record<string, string> = {
  California: "#3B82F6",
  Texas: "#10B981",
  "New York": "#F59E0B",
  Illinois: "#8B5CF6",
  "": "#F97316",
};

export const SUPPLEMENTARY_COLORS = [
  "#4F46E5",
  "#7C3AED",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#EAB308",
  "#BFDBFE",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#A78BFA",
  "#2563EB",
  "#059669",
  "#FBBF24",
  "#7C3AED",
  "#DC2626",
  "#0891B2",
  "#DB2777",
  "#15803D",
  "#EA580C",
];

export const getStateColor = (state: string): string => {
  if (STATE_COLOR_MAP[state]) {
    return STATE_COLOR_MAP[state];
  }

  const charCode = state.charCodeAt(0) + state.charCodeAt(state.length - 1);
  const index = charCode % SUPPLEMENTARY_COLORS.length;
  return SUPPLEMENTARY_COLORS[index];
};


export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  [RelationshipType.VENDOR]: "Vendor",
  [RelationshipType.CLASSMATE_COLLEGE]: "College Classmate",
  [RelationshipType.CLASSMATE_SCHOOL]: "School Classmate",
  [RelationshipType.COWORKER]: "Coworker",
  [RelationshipType.FAMILY]: "Family",
  [RelationshipType.FRIEND]: "Friend",
  [RelationshipType.COACH]: "Coach",
  [RelationshipType.STUDENT]: "Student",
  [RelationshipType.OTHER]: "Other",
};

export const RELATIONSHIP_TYPES = [
  RelationshipType.VENDOR,
  RelationshipType.CLASSMATE_COLLEGE,
  RelationshipType.CLASSMATE_SCHOOL,
  RelationshipType.COWORKER,
  RelationshipType.FAMILY,
  RelationshipType.FRIEND,
  RelationshipType.COACH,
  RelationshipType.STUDENT,
  RelationshipType.OTHER,
];

export const VIS_GRAPH_OPTIONS = {
  physics: {
    enabled: true,
    barnesHut: {
      gravitationalConstant: -80000,
      centralGravity: 0.3,
      springLength: 200,
      springConstant: 0.04,
      damping: 0.09,
      avoidOverlap: 0.2,
    },
    maxVelocity: 50,
    minVelocity: 0.75,
    solver: "barnesHut",
    timestep: 0.5,
    stabilization: {
      iterations: 200,
      fit: true,
      updateInterval: 25,
    },
  },
  interaction: {
    hover: true,
    navigationButtons: true,
    keyboard: true,
    zoomView: true,
    dragView: true,
  },
  nodes: {
    shape: "dot",
    borderWidth: 2,
    borderWidthSelected: 3,
    font: {
      size: 14,
      color: "#000",
    },
  },
  edges: {
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 0.5,
        type: "arrow",
      },
    },
    color: {
      color: "#969696",
      highlight: "#2E8B57",
      opacity: 0.2,
    },
    font: {
      size: 12,
      color: "#333",
      align: "middle",
    },
    smooth: {
      enabled: true,
      type: "continuous",
      roundness: 0.5,
    },
  },
};
