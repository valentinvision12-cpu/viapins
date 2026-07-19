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
}

/** Friendly empty panel for passport tabs — CTA leads back into discovery. */
export function PassportEmptyState({
  icon: Icon = Compass,
  title,
  description,
  ctaLabel,
  href = "/",
  onCta,
}: Props) {
  const ctaClass =
    "mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90";

  return (
    <div
      className="flex flex-col items-center rounded-2xl border px-6 py-14 text-center sm:px-8 sm:py-16"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: PASSPORT.accentSoft,
          border: `1px solid ${PASSPORT.accentBorder}`,
        }}
      >
        <Icon className="h-6 w-6" style={{ color: PASSPORT.accent }} />
      </div>
      <h3 className="text-base font-bold sm:text-lg" style={{ color: PASSPORT.text }}>
        {title}
      </h3>
      <p
        className="mt-2 max-w-sm text-sm leading-relaxed"
        style={{ color: PASSPORT.textMuted }}
      >
        {description}
      </p>
      {onCta ? (
        <button
          type="button"
          onClick={onCta}
          className={ctaClass}
          style={{ background: PASSPORT.accent }}
        >
          <Compass className="h-4 w-4" />
          {ctaLabel}
        </button>
      ) : (
        <Link href={href} className={ctaClass} style={{ background: PASSPORT.accent }}>
          <Compass className="h-4 w-4" />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
