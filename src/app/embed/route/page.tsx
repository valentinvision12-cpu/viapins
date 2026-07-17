import type { Metadata } from "next";
import { googleMapsPlaceUrl } from "@/lib/place-links";
import { SITE_NAME } from "@/lib/site-brand";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Travel Route Widget",
  robots: { index: false, follow: false },
};

interface EmbedPlace {
  n: string;   // name
  c: string;   // city
  r: string;   // country (region)
  i: string;   // image_url
  a: number;   // lat
  o: number;   // lng
}

interface EmbedPayload {
  t: string;         // title
  p: EmbedPlace[];   // places
}

function placeLocationUrl(lat: number, lng: number, name: string, city: string, country: string): string {
  return googleMapsPlaceUrl(lat, lng, name, city, country);
}

export default async function EmbedRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d: encoded } = await searchParams;

  let payload: EmbedPayload = { t: "Travel Route", p: [] };
  if (encoded) {
    try {
      payload = JSON.parse(decodeURIComponent(encoded));
    } catch {
      // fall through to empty state
    }
  }

  const cities = [...new Set(payload.p.map((p) => p.c))].join(" → ");

  return (
    <div
      style={{
        fontFamily: "var(--font-geist-sans, -apple-system, sans-serif)",
        background: "oklch(0.12 0.06 252)",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: "700",
              margin: 0,
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {payload.t}
          </p>
          {cities && (
            <p
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                margin: "3px 0 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📍 {cities}
            </p>
          )}
        </div>
        <span
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.28)",
            flexShrink: 0,
            marginLeft: "10px",
          }}
        >
          {payload.p.length} {payload.p.length === 1 ? "place" : "places"}
        </span>
      </div>

      {/* ── PLACES ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 0" }}>
        {payload.p.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "rgba(255,255,255,0.25)",
              fontSize: "13px",
            }}
          >
            No places in this route.
          </div>
        ) : (
          payload.p.map((place, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.04)",
                marginBottom: "6px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "oklch(0.72 0.13 82)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "800",
                  color: "oklch(0.12 0.008 260)",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              {place.i && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={place.i}
                  alt={place.n}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#fff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {place.n}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.38)",
                  }}
                >
                  {place.c}, {place.r}
                </p>
              </div>
              <a
                href={placeLocationUrl(place.a, place.o, place.n, place.c, place.r)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "5px",
                  borderRadius: "7px",
                  color: "rgba(255,255,255,0.3)",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
                title="Open in Google Maps"
              >
                📍
              </a>
            </div>
          ))
        )}
      </div>

      {/* ── FOOTER (SEO backlink) ────────────────────────────────────── */}
      <div
        style={{
          padding: "10px 16px 14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <a
          href={getSiteUrl()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.22)",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          ✦ Powered by {SITE_NAME}
        </a>
      </div>
    </div>
  );
}
