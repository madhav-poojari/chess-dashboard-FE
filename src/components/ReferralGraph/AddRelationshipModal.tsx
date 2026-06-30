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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                    <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Add Relationship
                    </h2>
                </div>
    
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                    {/* Body */}
                    <div className=" custom-scrollbar max-h-[500px] space-y-6 overflow-y-auto px-6 py-6">
                        {/* Referrer */}
                        <div>
                            <Combobox
                                label="Who referred? (Referrer)"
                                options={graphData?.nodes ?? []}
                                value={referrerId}
                                onChange={setReferrerId}
                                placeholder="Search user..."
                                formatOption={(node) => `${node.name} (${node.state})`}
                            />
                        </div>
    
                        {/* Referee */}
                        <div>
                            <Combobox
                                label="Who was referred? (Referee)"
                                options={graphData?.nodes ?? []}
                                value={refereeId}
                                onChange={setRefereeId}
                                placeholder="Search user..."
                                formatOption={(node) => `${node.name} (${node.state})`}
                            />
                        </div>
    
                        {/* Relationship Type */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Relationship Type
                            </label>
    
                            <select
                                value={relationshipType}
                                onChange={(e) => setRelationshipType(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-500"
                            >
                                {RELATIONSHIP_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {RELATIONSHIP_TYPE_LABELS[type]}
                                    </option>
                                ))}
                            </select>
                        </div>
    
                        {/* Notes */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Notes (Optional)
                            </label>
    
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add any additional notes..."
                                rows={4}
                                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-blue-500"
                            />
                        </div>
    
                        {createMutation.isError && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {createMutation.error?.message}
                            </p>
                        )}
                    </div>
    
                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-5 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
    
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createMutation.isPending ? "Adding..." : "Add Relationship"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
