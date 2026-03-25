// src/components/profile/GuidanceCard.tsx
import { GuidanceInfo } from "../../models/publicProfile";

interface GuidanceCardProps {
  label: "Mentor" | "Coach";
  info: GuidanceInfo | null;
}

export default function GuidanceCard({ label, info }: GuidanceCardProps) {
  const fideUrl = info?.fide_id
    ? `https://ratings.fide.com/profile/${info.fide_id}`
    : null;

  return (
    <div className="flex flex-col p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 flex-1">

      {/* Section label */}
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </p>

      {info ? (
        <>
          {/* Profile picture + name */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <img
                src={info.profile_picture_url || "/images/user/dummy-profile-image.png"}
                alt={info.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {info.name}
            </h5>
          </div>

          {/* Detail rows */}
          <div className="flex flex-col gap-4">

            {info.bio && (
              <div>
                <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">Bio</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">
                  {info.bio}
                </p>
              </div>
            )}

            {fideUrl && (
              <div>
                <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">FIDE Profile</p>
                <a
                  href={fideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-500 hover:underline dark:text-brand-400"
                >
                  View FIDE Profile →
                </a>
              </div>
            )}

            <div>
              <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">Meet Link</p>
              {info.personal_meet_link ? (
                <a
                  href={info.personal_meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-500 hover:underline dark:text-brand-400"
                >
                  Join Meeting →
                </a>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-600 italic">Not set</p>
              )}
            </div>

          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-600 italic">
          No {label.toLowerCase()} assigned yet.
        </p>
      )}

    </div>
  );
}