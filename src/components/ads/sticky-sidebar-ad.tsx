interface Props {
  script: string;
}

export function StickySidebarAd({ script }: Props) {
  const isDev = process.env.NODE_ENV === "development";
  const hasScript = script.trim().length > 0;

  if (!hasScript && !isDev) return null;

  return (
    <div className="hidden lg:block w-[300px] flex-shrink-0">
      <div className="sticky top-24">
        {hasScript ? (
          <div
            className="w-[300px]"
            dangerouslySetInnerHTML={{ __html: script }}
          />
        ) : (
          /* Dev placeholder */
          <div
            className="flex flex-col items-center justify-center rounded-2xl border"
            style={{
              width: "300px",
              height: "250px",
              background: "oklch(0.115 0.05 252)",
              borderColor: "oklch(0.72 0.13 82 / 0.15)",
            }}
          >
            <span
              className="text-[10px] font-mono tracking-[0.2em] uppercase mb-1.5"
              style={{ color: "oklch(0.72 0.13 82 / 0.4)" }}
            >
              📢 AD ZONE
            </span>
            <span className="text-[9px] text-center leading-relaxed px-4" style={{ color: "rgba(255,255,255,0.15)" }}>
              Sticky Sidebar
              <br />
              300×250
              <br />
              Configure in Admin → Monetization
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
