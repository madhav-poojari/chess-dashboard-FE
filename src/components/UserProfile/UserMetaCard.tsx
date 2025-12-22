import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { ChangeEvent, useState } from "react";
import { PublicProfile } from "../../models/publicProfile";

interface PlayLinksUpdate {
  uscf_id: string;
  fide_id: string;
  chesscom_username: string;
  lichess_username: string;
}

interface UserMetaCardProps {
  user: PublicProfile;            // Connects to the interface above
  onUpdate: (data: PlayLinksUpdate) => Promise<void> | void;  // A function that returns nothing
}

export default function UserMetaCard({ user, onUpdate }: UserMetaCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({
    first_name: user.first_name,
    city: user.city,
    state: user.state,
    country: user.country,
  });
  const [playLinks, setplayLinks] = useState({
    uscfId: user.uscfId,
    fideId: user.fideId,
    chessdotcomId: user.chessdotcomId,
    lichessId: user.lichessId,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setplayLinks((prev) => ({
      ...prev,
      [name]: value, // dynamically update the key
    }));
  };

  const lichessUrl = "https://lichess.org/@/" + playLinks.lichessId;
  const chessDotComUrl = "https://www.chess.com/member/" + playLinks.chessdotcomId;

  const handleSave = async () => {
    // Handle save logic here
    await onUpdate({ ...user, lichess_username: playLinks.lichessId, chesscom_username: playLinks.chessdotcomId, fide_id: playLinks.fideId, uscf_id: playLinks.uscfId });

    closeModal();
  };


  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center w-full gap-4 xl:gap-6 xl:flex-row">
            <div className="lg:w-20 lg:h-20 w-12 h-12 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
              <img src="/images/user/owner.jpg" alt="user" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90 xl:mb-2">
                {form.first_name}
              </h4>
              <div className="flex items-center gap-1 xl:gap-3">
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {`${form.city}, ${form.state} , ${form.country}`}
                </p>
              </div>
            </div>
            <div className="hidden xl:flex items-center gap-2 grow xl:justify-end">
              <a
                href={lichessUrl}
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Lichess SVG Icon</title><path fill="currentColor" d="M10.457 6.161a.237.237 0 0 0-.296.165c-.8 2.785 2.819 5.579 5.214 7.428c.653.504 1.216.939 1.591 1.292c1.745 1.642 2.564 2.851 2.733 3.178a.24.24 0 0 0 .275.122c.047-.013 4.726-1.3 3.934-4.574a.3.3 0 0 0-.023-.06L18.204 3.407L18.93.295a.24.24 0 0 0-.262-.293c-1.7.201-3.115.435-4.5 1.425c-4.844-.323-8.718.9-11.213 3.539C.334 7.737-.246 11.515.085 14.128c.763 5.655 5.191 8.631 9.081 9.532c.993.229 1.974.34 2.923.34c3.344 0 6.297-1.381 7.946-3.85a.24.24 0 0 0-.372-.3c-3.411 3.527-9.002 4.134-13.296 1.444c-4.485-2.81-6.202-8.41-3.91-12.749C4.741 4.221 8.801 2.362 13.888 3.31c.056.01.115 0 .165-.029l.335-.197c.926-.546 1.961-1.157 2.873-1.279l-.694 1.993a.24.24 0 0 0 .02.202l6.082 10.192c-.193 2.028-1.706 2.506-2.226 2.611c-.287-.645-.814-1.364-2.306-2.803c-.422-.407-1.21-.941-2.124-1.56c-2.364-1.601-5.937-4.02-5.391-5.984a.24.24 0 0 0-.165-.295" /></svg>
              </a>

              <a
                href={chessDotComUrl}
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Chessdotcom SVG Icon</title><path fill="#64af3c" d="M12 0a3.85 3.85 0 0 0-3.875 3.846A3.84 3.84 0 0 0 9.73 6.969l-2.79 1.85c0 .622.144 1.114.434 1.649H9.83c-.014.245-.014.549-.014.925q0 .037.006.071c-.064 1.353-.507 3.472-3.62 5.842c-.816.625-1.423 1.495-1.806 2.533a.3.3 0 0 0-.045.084a8.1 8.1 0 0 0-.39 2.516c0 .1.216 1.561 8.038 1.561s8.038-1.46 8.038-1.561c0-2.227-.824-4.048-2.24-5.133c-4.034-3.08-3.586-5.74-3.644-6.838h2.458c.29-.535.434-1.027.434-1.649l-2.79-1.836a3.86 3.86 0 0 0 1.604-3.123A3.87 3.87 0 0 0 13.445.275c-.004-.002-.01.004-.015.004A3.8 3.8 0 0 0 12 0" /></svg>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 xl:hidden">
            <a
              href={lichessUrl}
              target="_blank"
              rel="noopener"
              className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Lichess SVG Icon</title><path fill="currentColor" d="M10.457 6.161a.237.237 0 0 0-.296.165c-.8 2.785 2.819 5.579 5.214 7.428c.653.504 1.216.939 1.591 1.292c1.745 1.642 2.564 2.851 2.733 3.178a.24.24 0 0 0 .275.122c.047-.013 4.726-1.3 3.934-4.574a.3.3 0 0 0-.023-.06L18.204 3.407L18.93.295a.24.24 0 0 0-.262-.293c-1.7.201-3.115.435-4.5 1.425c-4.844-.323-8.718.9-11.213 3.539C.334 7.737-.246 11.515.085 14.128c.763 5.655 5.191 8.631 9.081 9.532c.993.229 1.974.34 2.923.34c3.344 0 6.297-1.381 7.946-3.85a.24.24 0 0 0-.372-.3c-3.411 3.527-9.002 4.134-13.296 1.444c-4.485-2.81-6.202-8.41-3.91-12.749C4.741 4.221 8.801 2.362 13.888 3.31c.056.01.115 0 .165-.029l.335-.197c.926-.546 1.961-1.157 2.873-1.279l-.694 1.993a.24.24 0 0 0 .02.202l6.082 10.192c-.193 2.028-1.706 2.506-2.226 2.611c-.287-.645-.814-1.364-2.306-2.803c-.422-.407-1.21-.941-2.124-1.56c-2.364-1.601-5.937-4.02-5.391-5.984a.24.24 0 0 0-.165-.295" /></svg>
            </a>
            <a
              href={chessDotComUrl}
              target="_blank"
              rel="noopener"
              className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Chessdotcom SVG Icon</title><path fill="#64af3c" d="M12 0a3.85 3.85 0 0 0-3.875 3.846A3.84 3.84 0 0 0 9.73 6.969l-2.79 1.85c0 .622.144 1.114.434 1.649H9.83c-.014.245-.014.549-.014.925q0 .037.006.071c-.064 1.353-.507 3.472-3.62 5.842c-.816.625-1.423 1.495-1.806 2.533a.3.3 0 0 0-.045.084a8.1 8.1 0 0 0-.39 2.516c0 .1.216 1.561 8.038 1.561s8.038-1.46 8.038-1.561c0-2.227-.824-4.048-2.24-5.133c-4.034-3.08-3.586-5.74-3.644-6.838h2.458c.29-.535.434-1.027.434-1.649l-2.79-1.836a3.86 3.86 0 0 0 1.604-3.123A3.87 3.87 0 0 0 13.445.275c-.004-.002-.01.004-.015.004A3.8 3.8 0 0 0 12 0" /></svg>
            </a>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 xl:hidden"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>

          <button
            onClick={openModal}
            className="hidden xl:inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your user up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Chess Links
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Lichess Username</Label>
                    <Input
                      name="lichessId"
                      type="text"
                      value={playLinks.lichessId}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>Chess.com username</Label>
                    <Input type="text" name="chessdotcomId"
                      value={playLinks.chessdotcomId} onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>USCF Id</Label>
                    <Input
                      type="text"
                      name="uscfId"
                      value={playLinks.uscfId}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>FIDE</Label>
                    <Input type="text"
                      name="fideId"
                      value={playLinks.fideId}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
