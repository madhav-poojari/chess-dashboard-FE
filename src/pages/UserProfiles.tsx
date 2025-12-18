import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";

import { useEffect, useState, useCallback } from "react";
import { userPublicProfile } from "../api/user/publicProfile";
import { PublicProfile } from "../models/publicProfile";
import { updateProfile } from "../api/user/service";
// import { userPublicProfile } from "../api/user";
// export default function UserProfiles() {
//   return (
//     <>
//       <PageMeta
//         title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
//         description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
//       />
//       <PageBreadcrumb pageTitle="Profile" />
//       <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
//         <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
//           Profile
//         </h3>
//         <div className="space-y-6">
//           <UserMetaCard />
//           <UserInfoCard />
//           <UserAddressCard />
//         </div>
//       </div>
//     </>
//   );
// }


export default function UserProfiles() {

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    userPublicProfile()
      .then((p) => mounted && setProfile(p))
      .catch((e) => mounted && setError(e as Error))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);
  // callback to update local state and optionally call API
  const handleUpdateUser = useCallback(
    async (patch: Partial<PublicProfile>) => {
      // patch is partial object, e.g. { first_name: 'New' }
      // optimistic update:
      console.log("liches id -- ",patch.lichessId);
      setProfile((prev) => {
        if (!prev) return null; // Safety check
        return { ...prev, ...patch };
      });
      try {
        await updateProfile(patch); // implement API call
      } catch (err) {
        console.error("Failed to save user:", err);
      }
    },
    []
  );
  // Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile</div>;

  return (profile && (
    <>
      <PageMeta
        title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard user={profile} onUpdate={handleUpdateUser} />
          <UserInfoCard user={profile} onUpdate={handleUpdateUser} />
          <UserAddressCard user={profile} onUpdate={handleUpdateUser} />
        </div>
      </div>
    </>
  ));
}
