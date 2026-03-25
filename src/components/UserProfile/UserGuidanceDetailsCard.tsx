// src/components/profile/UserGuidanceDetailsCard.tsx
import { PublicProfile } from "../../models/publicProfile";
import GuidanceCard from "./GuidanceCard";

interface UserGuidanceDetailsCardProps {
  user: PublicProfile;
  viewerRole?: string | null;
}

export default function UserGuidanceDetailsCard({
  user,
  viewerRole,
}: UserGuidanceDetailsCardProps) {
  if (!viewerRole || user.role !== "student") return null;

  const showMentor = viewerRole === "student" || viewerRole === "coach" || viewerRole === "admin";
  const showCoach = viewerRole === "student" || viewerRole === "mentor" || viewerRole === "admin";

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Guidance Details
      </h4>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {showMentor && user.mentorDetails && (
          <GuidanceCard label="Mentor" info={user.mentorDetails} />
        )}

        {showCoach && user.coachDetails && (
          <GuidanceCard label="Coach" info={user.coachDetails} />
        )}
      </div>
    </div>
  );
}