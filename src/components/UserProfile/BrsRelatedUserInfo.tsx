import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import { useState } from "react";
import { PublicProfile } from "../../models/publicProfile";
import { PencilIcon } from "../../icons";

interface BrsRelatedUserInfoProps {
  user: PublicProfile;
  onUpdate?: (data: Partial<PublicProfile>) => Promise<void> | void;
  readOnly?: boolean;
  viewerRole?: string;
}

export default function BrsRelatedUserInfo({
  user,
  onUpdate,
  readOnly = false,
  viewerRole
}: BrsRelatedUserInfoProps) {
  const { isOpen, openModal, closeModal } = useModal();

  const [addedToWhatsapp, setAddedToWhatsapp] = useState<boolean>(
    user?.added_in_whatsapp ?? false
  );

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate({
        added_in_whatsapp: addedToWhatsapp,
      });
    }
    closeModal();
  };

  if (!user) return null;
  if(!((viewerRole=="admin" || viewerRole=="mentor")&&(user.role=="student"))) return null;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-start">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            BRS Related Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Added to WhatsApp Community
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {addedToWhatsapp ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {!readOnly && onUpdate && (
          <button
            onClick={openModal}
            className="flex w-full lg:w-auto items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <PencilIcon />
            Edit
          </button>
        )}
      </div>

      {/* MODAL */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Edit BRS Information
          </h4>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={addedToWhatsapp}
                onChange={(e) => setAddedToWhatsapp(e.target.checked)}
                className="h-4 w-4"
              />
              <Label>Added to WhatsApp Community</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}