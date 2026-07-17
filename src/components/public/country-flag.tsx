"use client";

import { useState } from "react";
import { getCountryFlagUrl, getCountryFlag, getCountryDisplayName } from "@/lib/country-meta";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, { w: number; h: number; fetch: number; emoji: string }> = {
  sm: { w: 28, h: 21, fetch: 80, emoji: "text-lg" },
  md: { w: 44, h: 33, fetch: 120, emoji: "text-2xl" },
  lg: { w: 52, h: 39, fetch: 160, emoji: "text-3xl" },
  xl: { w: 56, h: 42, fetch: 160, emoji: "text-3xl" },
};

interface Props {
  country: string;
  size?: Size;
  className?: string;
}

export function CountryFlag({ country, size = "md", className }: Props) {
  const label = getCountryDisplayName(country);
  const px = SIZE_PX[size];
  const url = getCountryFlagUrl(country, px.fetch);
  const emoji = getCountryFlag(country);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <span
        className={cn("inline-flex items-center justify-center leading-none select-none", px.emoji, className)}
        style={{ width: px.w, height: px.h }}
        title={label}
        aria-label={label}
      >
        {emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={label}
      width={px.w}
      height={px.h}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn(
        "inline-block flex-shrink-0 rounded-sm object-cover",
        "drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]",
        className
      )}
      style={{ width: px.w, height: px.h }}
    />
  );
}
