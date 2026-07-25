"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "vp_vid";
const LEGACY_SESSION_KEY = "vp_sid";
const TAB_COUNT_KEY = "vp_tab_count";
const TAB_FLAG_KEY = "vp_tab_open";
const HEARTBEAT_MS = 12_000;

type CollectType = "pageview" | "heartbeat" | "leave";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  }
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** One ID per browser (all tabs) — not per tab. */
function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;

    // Migrate old per-tab session ids so reloads don't invent a new visitor.
    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
    const id =
      legacy && /^[a-zA-Z0-9_-]{8,64}$/.test(legacy) ? legacy : newId();
    localStorage.setItem(VISITOR_KEY, id);
    try {
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      /* ignore */
    }
    return id;
  } catch {
    return newId();
  }
}

function bumpOpenTabs(delta: number): number {
  try {
    const next = Math.max(
      0,
      (Number(localStorage.getItem(TAB_COUNT_KEY)) || 0) + delta
    );
    localStorage.setItem(TAB_COUNT_KEY, String(next));
    return next;
  } catch {
    return Math.max(0, delta);
  }
}

function send(type: CollectType, path: string, locale: string) {
  if (typeof window === "undefined") return;
  if (path.startsWith("/admin") || path.startsWith("/api")) return;

  const payload = JSON.stringify({
    sessionId: getVisitorId(),
    path,
    locale,
    referrer: document.referrer || null,
    type,
  });

  try {
    if ((type === "heartbeat" || type === "leave") && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/collect", blob);
      return;
    }
  } catch {
    /* fall through */
  }

  void fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
    credentials: "omit",
  }).catch(() => {});
}

/** Anonymous pageview + presence for public pages (1 visitor = 1 browser). */
export function AnalyticsBeacon({ locale }: { locale: string }) {
  const pathname = usePathname();
  const lastPath = useRef<string>("");
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  // Track open-tab count so leave only fires when the last public tab closes.
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(TAB_FLAG_KEY)) {
        sessionStorage.setItem(TAB_FLAG_KEY, "1");
        bumpOpenTabs(1);
      }
    } catch {
      bumpOpenTabs(1);
    }

    const onPageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      try {
        if (!sessionStorage.getItem(TAB_FLAG_KEY)) return;
        sessionStorage.removeItem(TAB_FLAG_KEY);
      } catch {
        /* still attempt leave */
      }
      const remaining = bumpOpenTabs(-1);
      if (remaining === 0) {
        send("leave", pathRef.current || "/", locale);
      }
    };

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [locale]);

  useEffect(() => {
    if (!pathname) return;
    if (pathname !== lastPath.current) {
      lastPath.current = pathname;
      send("pageview", pathname, locale);
    }

    const tick = () => send("heartbeat", pathname, locale);
    const id = window.setInterval(tick, HEARTBEAT_MS);

    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pathname, locale]);

  return null;
}
