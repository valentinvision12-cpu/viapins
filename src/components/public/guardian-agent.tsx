"use client";

import { useEffect, type ReactNode } from "react";

type GuardianIssue = {
  type: "error" | "rejection" | "resource";
  message: string;
  at: string;
};

const issues: GuardianIssue[] = [];
const MAX_ISSUES = 50;

function recordIssue(issue: Omit<GuardianIssue, "at">) {
  issues.unshift({ ...issue, at: new Date().toISOString() });
  if (issues.length > MAX_ISSUES) issues.pop();
  // Only log real JS errors in dev — skip broken images/scripts (too noisy).
  if (process.env.NODE_ENV === "development" && issue.type !== "resource") {
    console.warn("[Guardian]", issue.type, issue.message);
  }
}

/** Returns recent issues captured by the Guardian agent (dev/diagnostics). */
export function getGuardianIssues(): GuardianIssue[] {
  return [...issues];
}

/**
 * Centralised client-side monitoring:
 * - window errors
 * - unhandled promise rejections
 * - failed static resource loads (images, scripts)
 */
export function GuardianAgent({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      recordIssue({
        type: "error",
        message: event.message || "Unknown runtime error",
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const msg =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason ?? "Unhandled rejection");
      recordIssue({ type: "rejection", message: msg });
    };

    const onResourceError = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName?.toLowerCase();
      // Track script failures only — image 404s are common and not actionable.
      if (tag !== "script") return;
      const src = (target as HTMLScriptElement).src || "unknown";
      recordIssue({ type: "resource", message: `Failed to load ${tag}: ${src}` });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onResourceError, true);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onResourceError, true);
    };
  }, []);

  return <>{children}</>;
}
