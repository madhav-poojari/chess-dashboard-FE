import ShareCardLayout from "./ShareCardLayout";
import { useTheme } from "../../context/ThemeContext";
import { useShareToClipboard } from "./useShareToClipboard";
import ShareButton from "./ShareButton";

interface LessonPlanShareCardProps {
  studentName: string;
  startDate: string; // ISO or YYYY-MM-DD
  endDate: string;
  description: string; // newline-separated
}

function formatDateRange(start: string, end: string): string {
  const fmt = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

export default function LessonPlanShareCard({
  studentName,
  startDate,
  endDate,
  description,
}: LessonPlanShareCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { ref, share, sharing } = useShareToClipboard();

  const title = `${studentName}'s Lesson Plan`;
  const subtitle = formatDateRange(startDate, endDate);

  const lines = description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletColor = isDark ? "#6366f1" : "#465FFF";
  const textColor = isDark ? "#d1d5db" : "#374151";

  return (
    <>
      <ShareButton onClick={share} sharing={sharing} />

      <div style={{ position: "absolute", left: -9999, top: -9999 }}>
        <ShareCardLayout ref={ref} title={title} subtitle={subtitle} isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lines.map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: bulletColor,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 13, color: textColor, lineHeight: "1.5" }}>{line}</div>
              </div>
            ))}
          </div>
        </ShareCardLayout>
      </div>
    </>
  );
}
