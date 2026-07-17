"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  script: string;
}

export function StickyFooterAd({ script }: Props) {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty(
      "--footer-ad-height",
      visible ? "60px" : "0px"
    );
    return () => {
      document.documentElement.style.setProperty("--footer-ad-height", "0px");
    };
  }, [visible, mounted]);

  if (!mounted || !visible) return null;

  const isDev = process.env.NODE_ENV === "development";
  const hasScript = script.trim().length > 0;

  if (!hasScript && !isDev) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{ boxShadow: "0 -1px 0 rgba(255,255,255,0.06)" }}
    >
      {hasScript ? (
        /* Real ad: render the operator's script */
        <div
          className="w-full"
          dangerouslySetInnerHTML={{ __html: script }}
        />
      ) : (
        /* Dev placeholder */
        <div
          className="relative flex items-center justify-center"
          style={{ background: "oklch(0.10 0.04 252)", height: "60px" }}
        >
          <div className="flex items-center gap-2.5 pointer-events-none select-none">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: "oklch(0.72 0.13 82 / 0.4)" }}>
              📢 AD ZONE
            </span>
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>
              Sticky Footer · 728×90 · Configure in Admin → Monetization
            </span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded opacity-30 hover:opacity-60 transition-opacity"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
