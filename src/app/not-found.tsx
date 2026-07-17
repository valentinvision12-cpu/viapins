import Link from "next/link";
import { SITE_NAME } from "@/lib/site-brand";

export const metadata = {
  title: `Page Not Found · ${SITE_NAME}`,
};

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FDFBF7" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "#f5f0e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              marginBottom: 24,
            }}
          >
            🗺️
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>
            Page not found
          </h1>
          <p style={{ color: "#78716c", fontSize: "0.9rem", maxWidth: 320, lineHeight: 1.6, margin: "0 0 32px" }}>
            The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to exploring.
          </p>
          <Link
            href="/en"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 16,
              background: "#1c1917",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Back to {SITE_NAME}
          </Link>
        </div>
      </body>
    </html>
  );
}
