import ShareCardLayout from "./ShareCardLayout";
import { Attendance } from "../../api/attendance/service";
import { useTheme } from "../../context/ThemeContext";
import { useShareToClipboard } from "./useShareToClipboard";
import ShareButton from "./ShareButton";

type AttendanceViewType = "student_overview" | "coach_overview";

interface AttendanceShareCardProps {
  attendances: Attendance[];
  viewType: AttendanceViewType;
  monthLabel: string; // e.g. "April 2026"
  personName: string; // student or coach name depending on view
}

function formatDateOnly(iso: string): string {
  if (!iso) return "";
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function formatClassType(ct: string): string {
  return ct
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const MAX_ROWS = 25;

export default function AttendanceShareCard({
  attendances,
  viewType,
  monthLabel,
  personName,
}: AttendanceShareCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { ref, share, sharing } = useShareToClipboard();

  const isStudentView = viewType === "student_overview";
  const title = `${monthLabel} - ${personName}`;
  const subtitle = isStudentView ? "Student Attendance" : "Coach Attendance";
  const rows = attendances.slice(0, MAX_ROWS);

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "6px 8px",
    fontSize: 11,
    fontWeight: 600,
    color: isDark ? "#9ca3af" : "#6b7280",
    borderBottom: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "5px 8px",
    fontSize: 11,
    color: isDark ? "#d1d5db" : "#374151",
    borderBottom: `1px solid ${isDark ? "#374151" : "#f3f4f6"}`,
  };

  const verifiedDot = (ok: boolean): React.CSSProperties => ({
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: ok ? "#12B76A" : "#F04438",
  });

  return (
    <>
      <ShareButton onClick={share} sharing={sharing} />

      {/* Off-screen render target */}
      <div style={{ position: "absolute", left: -9999, top: -9999 }}>
        <ShareCardLayout ref={ref} title={title} subtitle={subtitle} isDark={isDark}>
          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>{isStudentView ? "Coach" : "Student"}</th>
                  <th style={thStyle}>Verified</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => (
                  <tr key={a.id}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>{formatDateOnly(a.date)}</td>
                    <td style={tdStyle}>{formatClassType(a.class_type)}</td>
                    <td style={tdStyle}>
                      {isStudentView
                        ? a.coach
                          ? `${a.coach.first_name} ${a.coach.last_name}`
                          : "-"
                        : a.student
                        ? `${a.student.first_name} ${a.student.last_name}`
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      <span style={verifiedDot(a.is_verified)} />
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>

          {attendances.length > MAX_ROWS && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: isDark ? "#6b7280" : "#9ca3af",
                textAlign: "center",
              }}
            >
              + {attendances.length - MAX_ROWS} more record(s)
            </div>
          )}
        </ShareCardLayout>
      </div>
    </>
  );
}
