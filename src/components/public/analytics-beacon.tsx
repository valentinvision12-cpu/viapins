"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "vp_vid";
const COOKIE_KEY = "vp_vid";
const LEGACY_SESSION_KEY = "vp_sid";
const TAB_COUNT_KEY = "vp_tab_count";
const TAB_FLAG_KEY = "vp_tab_open";
const HEARTBEAT_MS = 12_000;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type CollectType = "pageview" | "heartbeat" | "leave";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  }
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function validId(id: string | null | undefined): id is string {
  return !!id && /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

function readCookie(name: string): string | null {
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/**
 * One visitor ID per browser across all tabs.
 * Cookie first (shared), then localStorage — never re-seed from old per-tab session ids.
 */
function getVisitorId(): string {
  try {
    const fromCookie = readCookie(COOKIE_KEY);
    if (validId(fromCookie)) {
      try {
        localStorage.setItem(VISITOR_KEY, fromCookie);
      } catch {
        /* ignore */
      }
      return fromCookie;
    }

    const fromLs = localStorage.getItem(VISITOR_KEY);
    if (validId(fromLs)) {
      writeCookie(COOKIE_KEY, fromLs);
      return fromLs;
    }

    const id = newId();
    localStorage.setItem(VISITOR_KEY, id);
    writeCookie(COOKIE_KEY, id);
    try {
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      /* ignore */
    }
    return id;
  } catch {
    const fromCookie = readCookie(COOKIE_KEY);
    if (validId(fromCookie)) return fromCookie;
    const id = newId();
    writeCookie(COOKIE_KEY, id);
    return id;
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
    credentials: "same-origin",
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
