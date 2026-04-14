import { forwardRef } from "react";

interface ShareCardLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isDark: boolean;
}

/**
 * Common layout wrapper for all share-to-clipboard cards.
 * Renders the BRS logo, a title row, and children content.
 */
const ShareCardLayout = forwardRef<HTMLDivElement, ShareCardLayoutProps>(
  ({ title, subtitle, children, isDark }, ref) => {
    const bg = isDark ? "#1f2937" : "#ffffff";
    const text = isDark ? "#f3f4f6" : "#111827";
    const mutedText = isDark ? "#9ca3af" : "#6b7280";
    const border = isDark ? "#374151" : "#e5e7eb";

    return (
      <div
        ref={ref}
        style={{
          width: 540,
          fontFamily: "'Outfit', sans-serif",
          background: bg,
          color: text,
          borderRadius: 16,
          border: `1px solid ${border}`,
          padding: 28,
          boxSizing: "border-box",
        }}
      >
        {/* Header with logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <img
            src="/images/brs-logo/logo-without-name-favicon.png"
            alt="BRS"
            crossOrigin="anonymous"
            style={{ width: 36, height: 36, borderRadius: 8 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: "1.3" }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 12, color: mutedText, lineHeight: "1.3", marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: border, marginBottom: 20 }} />

        {/* Content */}
        {children}

        {/* Footer */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 12,
            borderTop: `1px solid ${border}`,
            textAlign: "center",
            fontSize: 10,
            color: isDark ? "#4b5563" : "#d1d5db",
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          BRS Academy
        </div>
      </div>
    );
  }
);

ShareCardLayout.displayName = "ShareCardLayout";
export default ShareCardLayout;
