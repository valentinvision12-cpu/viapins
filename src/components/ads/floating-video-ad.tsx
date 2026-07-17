"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  script: string;
}

export function FloatingVideoAd({ script }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const isDev = process.env.NODE_ENV === "development";
  const hasScript = script.trim().length > 0;

  if ((!hasScript && !isDev) || dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed bottom-24 right-4 z-35"
          style={{ zIndex: 35 }}
        >
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl border"
            style={{
              width: "300px",
              borderColor: "oklch(0.72 0.13 82 / 0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => { setVisible(false); setDismissed(true); }}
              className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:opacity-100"
              style={{ background: "rgba(0,0,0,0.6)", color: "#fff", opacity: 0.7 }}
            >
              <X className="w-3 h-3" />
            </button>

            {hasScript ? (
              <div dangerouslySetInnerHTML={{ __html: script }} />
            ) : (
              /* Dev placeholder */
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  width: "300px",
                  height: "180px",
                  background: "oklch(0.115 0.05 252)",
                }}
              >
                <span
                  className="text-[10px] font-mono tracking-[0.2em] uppercase mb-1.5"
                  style={{ color: "oklch(0.72 0.13 82 / 0.4)" }}
                >
                  📢 AD ZONE
                </span>
                <span className="text-[9px] text-center" style={{ color: "rgba(255,255,255,0.15)" }}>
                  Floating Video · 300×180
                  <br />
                  Appears after 8s · Configure in Admin
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
