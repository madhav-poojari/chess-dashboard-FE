import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRelationship,
  updateRelationship,
  deleteRelationship,
} from "../api/admin/referralGraphService";
import {
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  ReferralRelationship,
} from "../api/admin/referralGraph.dto";
import { ApiResponse } from "../api/user/dto";

interface UseRelationshipMutationReturn {
  // Create mutation
  createMutation: {
    mutate: (request: CreateRelationshipRequest) => void;
    mutateAsync: (request: CreateRelationshipRequest) => Promise<ApiResponse<ReferralRelationship>>;
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: Error | null;
    data: ApiResponse<ReferralRelationship> | undefined;
    reset: () => void;
  };
  // Update mutation
  updateMutation: {
    mutate: (params: { relationshipId: string; request: UpdateRelationshipRequest }) => void;
    mutateAsync: (params: {
      relationshipId: string;
      request: UpdateRelationshipRequest;
    }) => Promise<void>;
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: Error | null;
    reset: () => void;
  };
  // Delete mutation
  deleteMutation: {
    mutate: (relationshipId: string) => void;
    mutateAsync: (relationshipId: string) => Promise<void>;
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: Error | null;
    reset: () => void;
  };
}

export const useRelationshipMutation = (): UseRelationshipMutationReturn => {
  const queryClient = useQueryClient();

  // Mutation for creating a new relationship
  const createMutation = useMutation({
    mutationFn: (request: CreateRelationshipRequest) => createRelationship(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralGraph"] });
    },
    onError: (error) => {
      console.error("Failed to create relationship:", error);
    },
  });

  // Mutation for updating a relationship
  const updateMutation = useMutation({
    mutationFn: (params: { relationshipId: string; request: UpdateRelationshipRequest }) =>
      updateRelationship(params.relationshipId, params.request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralGraph"] });
    },
    onError: (error) => {
      console.error("Failed to update relationship:", error);
    },
  });

  // Mutation for deleting a relationship
  const deleteMutation = useMutation({
    mutationFn: (relationshipId: string) => deleteRelationship(relationshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralGraph"] });
    },
    onError: (error) => {
      console.error("Failed to delete relationship:", error);
    },
  });

  return {
    createMutation: {
      mutate: createMutation.mutate,
      mutateAsync: createMutation.mutateAsync,
      isPending: createMutation.isPending,
      isError: createMutation.isError,
      isSuccess: createMutation.isSuccess,
      error: createMutation.error as Error | null,
      data: createMutation.data,
      reset: createMutation.reset,
    },
    updateMutation: {
      mutate: updateMutation.mutate,
      mutateAsync: updateMutation.mutateAsync,
      isPending: updateMutation.isPending,
      isError: updateMutation.isError,
      isSuccess: createMutation.isSuccess,
      error: updateMutation.error as Error | null,
      reset: updateMutation.reset,
    },
    deleteMutation: {
      mutate: deleteMutation.mutate,
      mutateAsync: deleteMutation.mutateAsync,
      isPending: deleteMutation.isPending,
      isError: deleteMutation.isError,
      isSuccess: createMutation.isSuccess,
      error: deleteMutation.error as Error | null,
      reset: deleteMutation.reset,
    },
  };
};
