import ShareCardLayout from "./ShareCardLayout";
import { PublicProfile } from "../../models/publicProfile";
import { useTheme } from "../../context/ThemeContext";
import { useShareToClipboard } from "./useShareToClipboard";
import ShareButton from "./ShareButton";
import { getImageUrl } from "../../utils/imageUrl";

interface ProfileShareCardProps {
  profile: PublicProfile;
}

export default function ProfileShareCard({ profile }: ProfileShareCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { ref, share, sharing } = useShareToClipboard();

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const locationParts = [profile.city, profile.state, profile.country].filter(Boolean);
  const location = locationParts.join(", ");
  const profilePicUrl = profile.profile_picture_url
    ? getImageUrl(profile.profile_picture_url)
    : "";

  // Determine chess ID to display: fideId > lichessId > chessdotcomId
  const chessId = profile.fideId
    ? { label: "FIDE ID", value: profile.fideId }
    : profile.lichessId
    ? { label: "Lichess", value: profile.lichessId }
    : profile.chessdotcomId
    ? { label: "Chess.com", value: profile.chessdotcomId }
    : null;

  const mutedText = isDark ? "#9ca3af" : "#6b7280";
  const text = isDark ? "#f3f4f6" : "#111827";
  const pillBg = isDark ? "#111827" : "#f3f4f6";
  const pillBorder = isDark ? "#374151" : "#e5e7eb";

  return (
    <>
      <ShareButton onClick={share} sharing={sharing} />

      <div style={{ position: "absolute", left: -9999, top: -9999 }}>
        <ShareCardLayout ref={ref} title={fullName} isDark={isDark}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Profile picture */}
            {profilePicUrl ? (
              <img
                src={profilePicUrl}
                alt={fullName}
                crossOrigin="anonymous"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  objectFit: "cover",
                  border: `2px solid ${pillBorder}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  background: isDark ? "#374151" : "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color: mutedText,
                  flexShrink: 0,
                }}
              >
                {(profile.first_name?.[0] || "").toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name */}
              <div style={{ fontSize: 18, fontWeight: 700, color: text, marginBottom: 4 }}>
                {fullName}
              </div>

              {/* Location */}
              {location && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: mutedText,
                    marginBottom: 10,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={mutedText} strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {location}
                </div>
              )}

              {/* Chips row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.fideId && (
                  <Pill label="FIDE" value={profile.fideId} bg={pillBg} border={pillBorder} text={text} muted={mutedText} />
                )}
                {chessId && chessId.label !== "FIDE ID" && (
                  <Pill label={chessId.label} value={chessId.value} bg={pillBg} border={pillBorder} text={text} muted={mutedText} />
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                background: pillBg,
                borderRadius: 10,
                fontSize: 12,
                lineHeight: "1.6",
                color: isDark ? "#d1d5db" : "#374151",
              }}
            >
              {profile.bio}
            </div>
          )}
        </ShareCardLayout>
      </div>
    </>
  );
}

function Pill({
  label,
  value,
  bg,
  border,
  text,
  muted,
}: {
  label: string;
  value: string;
  bg: string;
  border: string;
  text: string;
  muted: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        padding: "4px 10px",
        borderRadius: 8,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <span style={{ fontWeight: 600, color: muted }}>{label}</span>
      <span style={{ fontWeight: 700, color: text }}>{value}</span>
    </div>
  );
}
