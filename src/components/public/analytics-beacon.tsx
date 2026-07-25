"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "vp_sid";
const HEARTBEAT_MS = 30_000;

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 32)
        : `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `s${Date.now().toString(36)}`;
  }
}

function send(type: "pageview" | "heartbeat", path: string, locale: string) {
  if (typeof window === "undefined") return;
  if (path.startsWith("/admin") || path.startsWith("/api")) return;

  const payload = JSON.stringify({
    sessionId: getSessionId(),
    path,
    locale,
    referrer: document.referrer || null,
    type,
  });

  try {
    if (type === "heartbeat" && navigator.sendBeacon) {
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

/** Anonymous pageview + presence heartbeat for public locale pages. */
export function AnalyticsBeacon({ locale }: { locale: string }) {
  const pathname = usePathname();
  const lastPath = useRef<string>("");

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
