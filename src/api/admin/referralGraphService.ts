import api from "../axiosInstance";
import { ApiResponse } from "../user/dto";
import {
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  GraphData,
  NodeDetail,
  ReferralRelationship,
} from "./referralGraph.dto";

export const fetchReferralGraph = async (state?: string): Promise<GraphData> => {
  try {
    const params = state ? { state } : undefined;
    const res = await api.get("/referral-network/graph", { params });
    const data: ApiResponse<GraphData> = res.data;

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch graph");
    }

    return data.data;
  } catch (error) {
    console.error("fetchReferralGraph error:", error);
    throw error;
  }
};

export const fetchNodeDetail = async (userId: string): Promise<NodeDetail> => {
  try {
      const res = await api.get(`/referral-network/node/${userId}`);
      const data: ApiResponse<NodeDetail> = res.data;

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch node detail");
    }

    return data.data;
  } catch (error) {
    console.error(`fetchNodeDetail(${userId}) error:`, error);
    throw error;
  }
};

export const createRelationship = async (
  request: CreateRelationshipRequest
): Promise<ApiResponse<ReferralRelationship>> => {
  try {
    const res = await api.post<ApiResponse<ReferralRelationship>>(
      "/referral-network/relationship",
      request
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to create relationship");
    }

    return res.data;
  } catch (error) {
    console.error("createRelationship error:", error);
    throw error;
  }
};

export const updateRelationship = async (
  relationshipId: string,
  request: UpdateRelationshipRequest
): Promise<void> => {
  try {
    const res = await api.put(
      `/referral-network/relationship/${relationshipId}`,
      request
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to update relationship");
    }

    return res.data;
  } catch (error) {
    console.error(`updateRelationship(${relationshipId}) error:`, error);
    throw error;
  }
};

export const deleteRelationship = async (
  relationshipId: string
): Promise<void> => {
  try {
    const res = await api.delete(
      `/referral-network/relationship/${relationshipId}`
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to delete relationship");
    }

    return res.data;
  } catch (error) {
    console.error(`deleteRelationship(${relationshipId}) error:`, error);
    throw error;
  }
};
