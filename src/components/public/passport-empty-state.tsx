"use client";

import type { LucideIcon } from "lucide-react";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PASSPORT } from "@/lib/luxury-palette";

interface Props {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  onCta?: () => void;
  secondaryCtaLabel?: string;
  secondaryHref?: string;
}

/** Friendly empty panel for passport tabs — CTAs lead back into discovery. */
export function PassportEmptyState({
  icon: Icon = Compass,
  title,
  description,
  ctaLabel,
  href = "/",
  onCta,
  secondaryCtaLabel,
  secondaryHref,
}: Props) {
  const primaryClass =
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm";
  const secondaryClass =
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-colors border";

  return (
    <div
      className="flex flex-col items-center rounded-2xl border px-6 py-16 text-center sm:px-10 sm:py-20"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border shadow-sm"
        style={{
          background: "#fff",
          borderColor: PASSPORT.cardBorder,
        }}
      >
        <Icon className="h-7 w-7" strokeWidth={1.5} style={{ color: PASSPORT.textMuted }} />
      </div>
      <h3 className="text-xl font-bold sm:text-2xl tracking-tight" style={{ color: PASSPORT.text }}>
        {title}
      </h3>
      <p
        className="mt-3 max-w-md text-sm sm:text-base leading-relaxed"
        style={{ color: PASSPORT.textMuted }}
      >
        {description}
      </p>
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        {onCta ? (
          <button
            type="button"
            onClick={onCta}
            className={primaryClass}
            style={{ background: PASSPORT.accent }}
          >
            {ctaLabel}
          </button>
        ) : (
          <Link href={href} className={primaryClass} style={{ background: PASSPORT.accent }}>
            {ctaLabel}
          </Link>
        )}
        {secondaryCtaLabel && secondaryHref ? (
          <Link
            href={secondaryHref}
            className={secondaryClass}
            style={{
              background: "#fff",
              borderColor: PASSPORT.cardBorder,
              color: PASSPORT.text,
            }}
          >
            {secondaryCtaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}