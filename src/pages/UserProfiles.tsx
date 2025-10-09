import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";

import { useEffect, useState, useCallback } from "react";
import { userPublicProfile } from "../actions/user";
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
  const [user, setUser] = useState(
    
    {
      first_name: "",
      last_name: "",
      email: "",
      uid: "",
      bio: "",
      country: "",
      city: "",
      state: "",
      postal_code: "",
      tax_id: "",
    }
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await userPublicProfile(); // fetch once
        if (!mounted) return;
        setUser(data);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(true);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    // return () => (mounted = false);
  }, []);

  // callback to update local state and optionally call API
  const handleUpdateUser = useCallback(
    async (patch) => {
      // patch is partial object, e.g. { first_name: 'New' }
      // optimistic update:
      setUser((prev) => ({ ...prev, ...patch }));

      try {
        // persist to server (optional: await and revert on failure)
        // await updateUserProfile(patch); // implement API call
      } catch (err) {
        console.error("Failed to save user:", err);
        // revert or show error; simple revert example:
        // re-fetch or setUser back from server
      }
    },
    []
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile</div>;

  return (
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
          <UserMetaCard user={user}  onUpdate={handleUpdateUser}/>
          <UserInfoCard user={user} onUpdate={handleUpdateUser} />
          <UserAddressCard user={user} onUpdate={handleUpdateUser} />
        </div>
      </div>
    </>
  );
}
