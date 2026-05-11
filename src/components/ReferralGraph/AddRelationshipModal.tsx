import React, { useState, useEffect } from "react";
import { useRelationshipMutation } from "../../hooks/useRelationshipMutation";
import { useReferralGraph } from "../../hooks/useReferralGraph";
import { RelationshipType, CreateRelationshipRequest } from "../../api/admin/referralGraph.dto";
import { RELATIONSHIP_TYPES, RELATIONSHIP_TYPE_LABELS } from "../../constants/referralGraphConstants";
import { Combobox } from "./ComboBox";

interface AddRelationshipModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddRelationshipModal({ onClose, onSuccess }: AddRelationshipModalProps) {
    const [referrerId, setReferrerId] = useState("");
    const [refereeId, setRefereeId] = useState("");
    const [relationshipType, setRelationshipType] = useState<string>(RelationshipType.VENDOR);
    const [description, setDescription] = useState("");

    const { data: graphData } = useReferralGraph();
    const { createMutation } = useRelationshipMutation();

    useEffect(() => {
        if (createMutation.isSuccess) {
            onSuccess();
            createMutation.reset();
        }
    }, [createMutation.isSuccess]);

    useEffect(() => {
        if (createMutation.isError && createMutation.error) {
            alert(`Error: ${createMutation.error.message}`);
            createMutation.reset();
        }
    }, [createMutation.isError, createMutation.error]);

    useEffect(() => {
        return () => {
            createMutation.reset();
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!referrerId || !refereeId) {
            alert("Please select both referrer and referee");
            return;
        }

        if (referrerId === refereeId) {
            alert("Referrer and referee cannot be the same person");
            return;
        }

        const request: CreateRelationshipRequest = {
            referrer_id: referrerId,
            referee_id: refereeId,
            relationship_type: relationshipType,
            relationship_description: description || undefined,
        };

        createMutation.mutate(request);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Relationship</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Referrer Select */}
                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Who referred? (Referrer)
                        </label>
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={referrerSearch}
                            onChange={(e) => setReferrerSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                        />
                        <select
                            value={referrerId}
                            onChange={(e) => setReferrerId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">Select referrer...</option>
                            {filteredReferrers?.map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.name} ({node.state})
                                </option>
                            ))}
                        </select>
                    </div> */}

                    <Combobox
                        label="Who referred? (Referrer)"
                        options={graphData?.nodes ?? []} // your full nodes array
                        value={referrerId}
                        onChange={setReferrerId}
                        placeholder="Search user..."
                        formatOption={(node) => `${node.name} (${node.state})`}
                    />

                    {/* Referee Select */}
                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Who was referred? (Referee)
                        </label>
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={refereeSearch}
                            onChange={(e) => setRefereeSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                        />
                        <select
                            value={refereeId}
                            onChange={(e) => setRefereeId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">Select referee...</option>
                            {filteredReferees?.map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.name} ({node.state})
                                </option>
                            ))}
                        </select>
                    </div> */}

                    <Combobox
                        label="Who was referred? (Referee)"
                        options={graphData?.nodes ?? []}
                        value={refereeId}
                        onChange={setRefereeId}
                        placeholder="Search user..."
                        formatOption={(node) => `${node.name} (${node.state})`}
                    />

                    {/* Relationship Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Relationship Type
                        </label>
                        <select
                            value={relationshipType}
                            onChange={(e) => setRelationshipType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            {RELATIONSHIP_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {RELATIONSHIP_TYPE_LABELS[type]}
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
                            disabled={createMutation.isPending}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                        >
                            {createMutation.isPending ? "Adding..." : "Add"}
                        </button>
                    </div>

                    {createMutation.isError && (
                        <p className="text-sm text-red-600 mt-2">{createMutation.error?.message}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
