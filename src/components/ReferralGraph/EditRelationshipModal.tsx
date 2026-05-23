
import React, { useState, useEffect } from "react";
import { useRelationshipMutation } from "../../hooks/useRelationshipMutation";
import { UpdateRelationshipRequest } from "../../api/admin/referralGraph.dto";
import { RELATIONSHIP_TYPES, RELATIONSHIP_TYPE_LABELS } from "../../constants/referralGraphConstants";

interface EditRelationshipModalProps {
    relationshipId: string;
    relationshipType: string;
    relationshipDescription?: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditRelationshipModal({
    relationshipId,
    relationshipType,
    relationshipDescription,
    onClose,
    onSuccess,
}: EditRelationshipModalProps) {
    const [type, setType] = useState(relationshipType);
    const [description, setDescription] = useState(relationshipDescription || "");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { updateMutation, deleteMutation } = useRelationshipMutation();

    useEffect(() => {
        if (updateMutation.isSuccess) {
            onSuccess();
            updateMutation.reset();
        }
    }, [updateMutation.isSuccess]);

    useEffect(() => {
        if (updateMutation.isError && updateMutation.error) {
            alert(`Error: ${updateMutation.error.message}`);
            updateMutation.reset();
        }
    }, [updateMutation.isError]);

    useEffect(() => {
        if (deleteMutation.isSuccess) {
            onSuccess();
            deleteMutation.reset();
        }
    }, [deleteMutation.isSuccess]);

    useEffect(() => {
        if (deleteMutation.isError && deleteMutation.error) {
            alert(`Error: ${deleteMutation.error.message}`);
            deleteMutation.reset();
        }
    }, [deleteMutation.isError]);

    useEffect(() => {
        return () => {
            updateMutation.reset();
            deleteMutation.reset();
        };
    }, []);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();

        const request: UpdateRelationshipRequest = {
            relationship_type: type,
            relationship_description: description || undefined,
        };

        updateMutation.mutate(
            { relationshipId, request }
        );
    };

    const handleDelete = () => {
        deleteMutation.mutate(relationshipId);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Relationship</h2>

                {!showDeleteConfirm ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        {/* Relationship Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Relationship Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                {RELATIONSHIP_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {RELATIONSHIP_TYPE_LABELS[t]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add any additional notes..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                            >
                                {updateMutation.isPending ? "Saving..." : "Save"}
                            </button>
                        </div>

                        {/* Delete Button */}
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition font-medium mt-2"
                        >
                            Delete Relationship
                        </button>

                        {updateMutation.isError && (
                            <p className="text-sm text-red-600">{updateMutation.error?.message}</p>
                        )}
                    </form>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-700">Are you sure you want to delete this relationship?</p>
                        <p className="text-sm text-gray-600">This action cannot be undone.</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>

                        {deleteMutation.isError && (
                            <p className="text-sm text-red-600">{deleteMutation.error?.message}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
