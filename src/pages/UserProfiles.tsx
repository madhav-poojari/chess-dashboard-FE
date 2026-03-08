import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";

import { useEffect, useState, useCallback } from "react";
import { userPublicProfile } from "../api/user/publicProfile";
import { PublicProfile } from "../models/publicProfile";
import { updateProfile } from "../api/user/service";
import { useAuth } from "../context/AuthContext";
import BrsRelatedUserInfo from "../components/UserProfile/BrsRelatedUserInfo";
import UserGuidanceDetailsCard from "../components/UserProfile/UserGuidanceDetailsCard";
// import { userPublicProfile } from "../api/user";
// export default function UserProfiles() {
//   return (
//     <>
//       <PageMeta
//         title="BRS chess Profile Dashboard |  Next.js Admin Dashboard "
//         description="This is BRS chess Profile Dashboard page "
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


interface UserProfilesProps {
  studentId?: string | null;
  readOnly?: boolean;
}

export default function UserProfiles({ studentId, readOnly = false }: UserProfilesProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setProfile(null);
    userPublicProfile(studentId || undefined)
      .then((p) => {
        if (mounted) {
          setProfile(p);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e as Error);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [studentId]);
  // callback to update local state and optionally call API
  const handleUpdateUser = useCallback(
    async (patch: Partial<PublicProfile> | { uscf_id?: string; fide_id?: string; chesscom_username?: string; lichess_username?: string }) => {
      // patch is partial object, e.g. { first_name: 'New' } or PlayLinksUpdate
      // Convert PlayLinksUpdate format to PublicProfile format if needed
      let profilePatch: Partial<PublicProfile>;

      if ('uscf_id' in patch || 'fide_id' in patch || 'chesscom_username' in patch || 'lichess_username' in patch) {
        // Convert snake_case to camelCase
        profilePatch = {
          uscfId: patch.uscf_id,
          fideId: patch.fide_id,
          chessdotcomId: patch.chesscom_username,
          lichessId: patch.lichess_username,
        };
      } else {
        // It's already in PublicProfile format
        profilePatch = patch as Partial<PublicProfile>;
      }

      // optimistic update:
      console.log("liches id -- ", profilePatch.lichessId);
      setProfile((prev) => {
        if (!prev) return null; // Safety check
        return { ...prev, ...profilePatch };
      });
      try {
        // Include uid from current profile state so API knows which user to update
        await updateProfile({ ...profilePatch, uid: profile?.uid });
      } catch (err) {
        console.error("Failed to save user:", err);
      }
    },
    [profile?.uid]
  );
  // Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile</div>;

  const updateHandler = readOnly ? undefined : handleUpdateUser;
  const CAN_EDIT_SYLLABUS = ["coach", "mentor", "admin"];
  const syllabusUpdateHandler = CAN_EDIT_SYLLABUS.includes(user?.role?.toLowerCase() || "")
    ? handleUpdateUser
    : undefined;

  return (profile && (
    <>
      {!readOnly && (
        <>
          <PageMeta
            title="BRS chess Profile Dashboard |  Next.js Admin Dashboard "
            description="This is BRS chess Profile Dashboard page "
          />
          <PageBreadcrumb pageTitle="Profile" />
        </>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard user={profile} onUpdate={updateHandler} onSyllabusUpdate={syllabusUpdateHandler} readOnly={readOnly} viewerRole={user?.role?.toLowerCase()} />
          <BrsRelatedUserInfo user={profile} onUpdate={handleUpdateUser} readOnly={false} viewerRole={user?.role?.toLowerCase()} />
          <UserGuidanceDetailsCard user={profile} viewerRole={user?.role?.toLowerCase()} />
          <UserInfoCard user={profile} onUpdate={updateHandler} readOnly={readOnly} />
          <UserAddressCard user={profile} onUpdate={updateHandler} readOnly={readOnly} />
        </div>
      </div>
    </>
  ));
}
