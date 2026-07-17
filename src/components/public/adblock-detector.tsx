"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { Shield, X } from "lucide-react";
import { fetchWithTimeout } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site-brand";

interface AdBlockContextValue {
  adBlockDetected: boolean;
}

const AdBlockContext = createContext<AdBlockContextValue>({ adBlockDetected: false });

const DISMISS_KEY = "viapins-adblock-dismissed";

export function useAdBlock() {
  return useContext(AdBlockContext);
}

/** Classic bait element — ad blockers hide nodes with ad-like class names. */
function detectBaitElement(): boolean {
  if (typeof document === "undefined") return false;

  const bait = document.createElement("div");
  bait.innerHTML = "&nbsp;";
  bait.className = "adsbox ad-banner advertisement adsbygoogle";
  bait.setAttribute("data-ad-slot", "probe");
  bait.style.cssText =
    "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;";

  document.body.appendChild(bait);
  const style = window.getComputedStyle(bait);
  const blocked =
    bait.offsetHeight === 0 ||
    bait.clientHeight === 0 ||
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0";
  document.body.removeChild(bait);
  return blocked;
}

/**
 * Ad blockers often block URLs containing "/ads/".
 * Rewritten to /api/ads/check in next.config.ts — succeeds only when not blocked.
 */
async function detectFetchProbe(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `/ads/check?rand=${Math.random()}`,
      { method: "HEAD", cache: "no-store" },
      4000
    );
    return res.status !== 200;
  } catch {
    return true;
  }
}

async function detectAdBlock(): Promise<boolean> {
  const [bait, fetchBlocked] = await Promise.all([
    Promise.resolve(detectBaitElement()),
    detectFetchProbe(),
  ]);
  // Require both signals to avoid false positives from slow networks or strict browsers.
  return bait && fetchBlocked;
}

export function AdBlockProvider({ children }: { children: ReactNode }) {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(async () => {
      const detected = await detectAdBlock();
      if (mounted) {
        setAdBlockDetected(detected);
        setChecked(true);
      }
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  function handleDisabledReload() {
    sessionStorage.removeItem(DISMISS_KEY);
    window.location.reload();
  }

  const showModal = checked && adBlockDetected && !dismissed;

  return (
    <AdBlockContext.Provider value={{ adBlockDetected: checked && adBlockDetected }}>
      {children}
      {showModal && (
        <AdBlockModal
          onDismiss={handleDismiss}
          onDisabledReload={handleDisabledReload}
        />
      )}
    </AdBlockContext.Provider>
  );
}

function AdBlockModal({
  onDismiss,
  onDisabledReload,
}: {
  onDismiss: () => void;
  onDisabledReload: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adblock-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 id="adblock-title" className="font-bold text-stone-900 text-base">
                Ad Blocker Detected
              </h2>
              <p className="text-stone-500 text-xs mt-0.5">{SITE_NAME} is free to use</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-stone-600 text-sm leading-relaxed">
            It looks like you&apos;re using an ad blocker. {SITE_NAME} is a free discovery
            platform — we rely on minimal, non-intrusive ads to keep it running at no cost
            to you.
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "Browsing all destinations remains free",
              "Building and downloading GPX routes stays free",
              "Your passport and saved trips are not affected",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2 text-stone-600 text-sm">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-amber-800 text-xs leading-relaxed">
              <strong>To support us:</strong> please consider disabling your ad blocker for{" "}
              <strong>{SITE_NAME}</strong>, or allowlisting this site. Account creation and
              &ldquo;Add to Passport&rdquo; features are paused while ad blocking is active.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 py-3 rounded-2xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
          >
            Continue browsing
          </button>
          <button
            onClick={onDisabledReload}
            className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            I&apos;ve disabled it
          </button>
        </div>
      </div>
    </div>
  );
}
