"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  script: string;
}

export function SmartHeaderAd({ script }: Props) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--smart-ad-height",
      show && !dismissed ? "56px" : "0px"
    );
    return () => {
      document.documentElement.style.setProperty("--smart-ad-height", "0px");
    };
  }, [show, dismissed]);

  useEffect(() => {
    function onScroll() {
      const current = window.scrollY;
      const scrollingUp = current < lastScrollY.current;
      const pastFold = current > 300;
      if (scrollingUp && pastFold && !dismissed) {
        setShow(true);
      } else if (!scrollingUp) {
        setShow(false);
      }
      lastScrollY.current = current;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  const isDev = process.env.NODE_ENV === "development";
  const hasScript = script.trim().length > 0;

  if ((!hasScript && !isDev) || dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed left-0 right-0 z-40"
          style={{
            top: "var(--site-header-height)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {hasScript ? (
            <div className="w-full" dangerouslySetInnerHTML={{ __html: script }} />
          ) : (
            <div
              className="relative flex items-center justify-center"
              style={{ background: "oklch(0.115 0.05 252)", height: "56px" }}
            >
              <div className="flex items-center gap-2.5 pointer-events-none select-none">
                <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: "oklch(0.72 0.13 82 / 0.4)" }}>
                  📢 AD ZONE
                </span>
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                  Smart Header · 728×90 · Appears on scroll-up · Configure in Admin
                </span>
              </div>
              <button
                onClick={() => { setDismissed(true); setShow(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded opacity-30 hover:opacity-60 transition-opacity"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
