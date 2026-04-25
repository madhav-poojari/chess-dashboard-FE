export enum RelationshipType {
  VENDOR = "vendor",
  CLASSMATE_COLLEGE = "classmate_college",
  CLASSMATE_SCHOOL = "classmate_school",
  COWORKER = "coworker",
  FAMILY = "family",
  FRIEND = "friend",
  COACH = "coach",
  STUDENT = "student",
  OTHER = "other",
}

export interface GraphNode {
  id: string; 
  name: string; 
  state: string; 
  city: string; 
  role: string; 
  profile_picture_url?: string; 
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: RelationshipType | string;
  relationship_description?: string | null;
  created_at: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    total_nodes: number;
    total_edges: number;
  };
}

export interface NodeDetail {
  user_id: string;
  full_name: string;
  email: string;
  state: string;
  city: string;
  country: string;
  role: string;
  profile_picture_url?: string;
  bio?: string;
  personal_meet_link?: string;
  uscf_id?: string;
  lichess_username?: string;
  chesscom_username?: string;
  referred_by: ReferralSummary[];
  referred_to: ReferralSummary[];
}

export interface ReferralSummary {
  user_id: string;
  name: string;
  relationship_type: RelationshipType | string;
  relationship_description?: string | null;
}

export interface CreateRelationshipRequest {
  referrer_id: string;
  referee_id: string;
  relationship_type: RelationshipType | string;
  relationship_description?: string;
}

export interface ReferralRelationship{
    id: string;
    referrer_id: string;
    referee_id: string;
    relationship_type: RelationshipType | string;
    relationship_description?: string | null;
    created_at: string;
}

export interface UpdateRelationshipRequest {
  relationship_type?: RelationshipType | string;
  relationship_description?: string;
}
