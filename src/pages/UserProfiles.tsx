import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import StudentGallery from "../components/UserProfile/StudentGallery";

import { useEffect, useState, useCallback } from "react";
import { userPublicProfile } from "../api/user/publicProfile";
import { PublicProfile } from "../models/publicProfile";
import { updateProfile } from "../api/user/service";
import { useShareProfileImage } from "../hooks/useShareProfileImage";


interface UserProfilesProps {
  studentId?: string | null;
  readOnly?: boolean;
  /** Controls gallery readOnly independently from profile readOnly. Defaults to readOnly. */
  galleryReadOnly?: boolean;
}

export default function UserProfiles({ studentId, readOnly = false, galleryReadOnly }: UserProfilesProps) {

  const isGalleryReadOnly = galleryReadOnly ?? readOnly;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "gallery">("profile");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setProfile(null);
    setActiveTab("profile");
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
  const { shareProfile, isGenerating } = useShareProfileImage(profile);

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
        {/* Tab switcher at the top */}
        <div className="flex items-center gap-4 mb-5 lg:mb-7">
          <button
            onClick={() => setActiveTab("profile")}
            className={`text-lg font-semibold transition-colors ${activeTab === "profile"
                ? "text-gray-800 dark:text-white/90"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
          >
            Profile
          </button>
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
          <button
            onClick={() => setActiveTab("gallery")}
            className={`text-lg font-semibold transition-colors ${activeTab === "gallery"
                ? "text-gray-800 dark:text-white/90"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
          >
            Gallery
          </button>

          {activeTab === "profile" && (
            <button
              onClick={shareProfile}
              disabled={isGenerating}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
              Share
            </button>
          )}
        </div>

        {activeTab === "profile" ? (
          <div className="space-y-6">
            <UserMetaCard user={profile} onUpdate={updateHandler} readOnly={readOnly} />
            <UserInfoCard user={profile} onUpdate={updateHandler} readOnly={readOnly} />
            <UserAddressCard user={profile} onUpdate={updateHandler} readOnly={readOnly} />
          </div>
        ) : (
          <StudentGallery userId={profile.uid} readOnly={isGalleryReadOnly} />
        )}
      </div>
    </>
  ));
}
