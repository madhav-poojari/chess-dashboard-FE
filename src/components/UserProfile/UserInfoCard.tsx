import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import {  useState } from "react";
import { PublicProfile } from "../../models/publicProfile";

/** Compute current age from a DOB ISO string. */
function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Compute current age from a stored age + the date it was recorded. */
function ageFromRecorded(age: number, recordedAt: string): number {
  const recorded = new Date(recordedAt);
  const today = new Date();
  const yearsDiff = today.getFullYear() - recorded.getFullYear();
  // Check if the anniversary has passed this year
  const monthDiff = today.getMonth() - recorded.getMonth();
  const dayDiff = today.getDate() - recorded.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return age + yearsDiff - 1;
  }
  return age + yearsDiff;
}

/** Format an ISO date string as MM/DD/YYYY for display. */
function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

interface InfoUpdate{
  first_name: string;
  last_name: string;
  bio: string;
  dob?: string | null;
  age?: number | null;
}
interface UserInfoCardProps {
  user: PublicProfile;            // Connects to the interface above
  onUpdate?: (data:InfoUpdate) => Promise<void> | void;  // A function that returns nothing
  readOnly?: boolean;
}
export default function UserInfoCard({user, onUpdate, readOnly = false}:UserInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({
    first_name:user.first_name,
    last_name:user.last_name,
    email:user.email,
    uid:user.uid,
    bio:user.bio
  });

  // DOB/Age edit state
  type DobAgeMode = "dob" | "age";
  const initialMode: DobAgeMode = user.dob ? "dob" : "age";
  const [dobAgeMode, setDobAgeMode] = useState<DobAgeMode>(initialMode);
  // Convert DOB ISO string to YYYY-MM-DD for date input
  const initialDobInput = user.dob ? user.dob.slice(0, 10) : "";
  const [dobInput, setDobInput] = useState(initialDobInput);
  const [ageInput, setAgeInput] = useState<string>(
    user.age != null ? String(user.age) : ""
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value, // dynamically update the key
    }));
  };

  // useEffect(() => {
  //   let mounted = true; // avoid state update after unmount

  //   async function loadUser() {
  //     try {
  //       const userDict = await userPublicProfile(); // await the fetched data
  //       if (!mounted) return;
  //       setUser({
  //         first_name: userDict.first_name,
  //         last_name:  userDict.last_name,
  //         email:      userDict.email,
  //         uid:        userDict.uid,
  //         bio:        userDict.bio ,
  //       });
  //     } catch (err) {
  //       console.error("Failed to load user:", err);
  //     }
  //   }

  //   loadUser();
  //   return () => {
  //     mounted = false;
  //   };
  // }, []); 


  
   const handleSave = async () => {
    // Handle save logic here
    const patch: InfoUpdate = {
      ...user,
      first_name: form.first_name,
      last_name: form.last_name,
      bio: form.bio,
    };

    if (dobAgeMode === "dob" && dobInput) {
      // Send as RFC3339 to match backend expectation
      patch.dob = new Date(dobInput).toISOString();
      patch.age = undefined; // don't send age
    } else if (dobAgeMode === "age" && ageInput) {
      patch.age = parseInt(ageInput, 10);
      patch.dob = undefined; // don't send dob
    }

    if (onUpdate) {
      await onUpdate(patch);
    }

    closeModal();
  };

  // Compute display values for DOB/Age
  let ageDisplay = "Not provided";
  if (user.dob) {
    const computed = ageFromDob(user.dob);
    ageDisplay = `${formatDate(user.dob)} (${computed} yrs)`;
  } else if (user.age != null && user.age_recorded_at) {
    const computed = ageFromRecorded(user.age, user.age_recorded_at);
    ageDisplay = `${computed} yrs (approx.)`;
  }

  if (Object.keys(user).length === 0) return <div>Loading...</div>;
 return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {form.first_name}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {form.last_name}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {form.email}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                User Id
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {form.uid}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Bio
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {form.bio}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Date of Birth / Age
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {ageDisplay}
              </p>
            </div>
          </div>
        </div>

        {!readOnly && onUpdate && (
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
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
        )}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              
              <div className="">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input type="text" name="first_name" value={form.first_name} onChange={handleChange}/>
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input type="text" name="last_name" value={form.last_name} onChange={handleChange}/>
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input type="text" name="last_name" value={form.email} onChange={handleChange} disabled={true}/>
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>User ID</Label>
                    <Input type="text" name="uid" value={form.uid} disabled={true} />
                  </div>

                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" name="bio" value={form.bio} onChange={handleChange}/>
                  </div>

                  {/* DOB / Age toggle */}
                  <div className="col-span-2">
                    <Label>Date of Birth / Age</Label>
                    <div className="flex items-center gap-4 mb-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="dob_age_mode"
                          value="dob"
                          checked={dobAgeMode === "dob"}
                          onChange={() => setDobAgeMode("dob")}
                          className="accent-brand-500"
                        />
                        Date of Birth
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="dob_age_mode"
                          value="age"
                          checked={dobAgeMode === "age"}
                          onChange={() => setDobAgeMode("age")}
                          className="accent-brand-500"
                        />
                        Age
                      </label>
                    </div>
                    {dobAgeMode === "dob" ? (
                      <Input
                        type="date"
                        name="dob"
                        value={dobInput}
                        onChange={(e) => setDobInput(e.target.value)}
                      />
                    ) : (
                      <Input
                        type="number"
                        name="age"
                        value={ageInput}
                        onChange={(e) => setAgeInput(e.target.value)}
                        placeholder="Enter age in years"
                      />
                    )}
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
    </div>
  );
}
