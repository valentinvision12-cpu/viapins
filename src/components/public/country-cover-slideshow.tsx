"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { cn } from "@/lib/utils";
import { fallbackImageUrl } from "@/lib/fallback-image";

/** Card grid — slow enough to read the landmark */
export const COVER_SLIDE_INTERVAL_CARD_MS = 14_000;
/** Country hero — slightly slower */
export const COVER_SLIDE_INTERVAL_HERO_MS = 16_000;

interface Props {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  /** ms between slides; 0 = no auto-rotate */
  intervalMs?: number;
  sizes?: string;
  priority?: boolean;
}

export function CountryCoverSlideshow({
  images,
  alt,
  className,
  imageClassName,
  intervalMs = COVER_SLIDE_INTERVAL_CARD_MS,
  sizes = "100vw",
  priority = false,
}: Props) {
  const slides = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [paused, setPaused] = useState(false);

  const visible = slides.filter((u) => !failed.has(u));

  useEffect(() => {
    setActive(0);
  }, [slides.join("|")]);

  useEffect(() => {
    if (visible.length <= 1 || intervalMs <= 0 || paused) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % visible.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [visible.length, intervalMs, paused]);

  if (visible.length === 0) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={fallbackImageUrl(alt, 1400, 900)}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            "object-cover brightness-[0.96] contrast-[1.06] saturate-[1.04]",
            imageClassName
          )}
              unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
      </div>
    );
  }

  const current = Math.min(active, visible.length - 1);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {visible.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority && i === 0}
          className={cn(
            "object-cover transition-opacity duration-[2400ms] ease-in-out",
            "brightness-[1.02] contrast-[1.04] saturate-[1.06]",
            i === current ? "opacity-100" : "opacity-0",
            imageClassName
          )}
          onError={() => setFailed((prev) => new Set(prev).add(src))}
              unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
      ))}

      {visible.length > 1 && (
        <div className="absolute bottom-3 right-3 z-10 flex gap-1.5 pointer-events-auto">
          {visible.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActive(i);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === current ? "bg-white scale-110" : "bg-white/45 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
