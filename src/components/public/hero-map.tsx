"use client";

import Image from "next/image";
import { IMAGE_UNOPTIMIZED } from "@/lib/image-runtime";
import { useTranslations } from "next-intl";
import { Search, Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { DestinationCard } from "@/actions/get-destinations";
import { InspireMeButton } from "@/components/public/inspire-me-modal";
import { LUXURY, COMPASS } from "@/lib/luxury-palette";

const COMPASS_IMAGE = "/images/hero-luxury-compass.png";

interface HeroMapProps {
  inspireCities: DestinationCard[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
}

export function HeroMap({
  inspireCities,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: HeroMapProps) {
  const t = useTranslations("home");

  return (
    <section
      id="hero"
      className="relative flex flex-col items-center overflow-hidden px-4 pb-12 md:pb-16"
      style={{
        background: `linear-gradient(168deg, ${COMPASS.mist} 0%, ${COMPASS.sky} 42%, #ECE8E2 78%, ${LUXURY.cream} 100%)`,
        paddingTop: "calc(var(--site-header-height) + var(--smart-ad-height, 0px) + 1.25rem)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(138,173,184,0.18) 0%, transparent 68%)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: [
            `linear-gradient(${COMPASS.grid} 1px, transparent 1px)`,
            `linear-gradient(90deg, ${COMPASS.grid} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: "72px 72px",
          opacity: 0.5,
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[7]"
        style={{
          background: `radial-gradient(ellipse 82% 68% at 50% 34%, ${COMPASS.textScrim} 0%, rgba(210,228,235,0.35) 50%, transparent 76%)`,
        }}
      />

      <HeroLuxuryCompass />

      <div className="relative z-10 text-center w-full max-w-2xl mx-auto">
        <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase mb-3 text-[#D9472C]">
          {t("heroEyebrow")}
        </p>

        <h1
          className="text-[2.15rem] leading-[1.02] sm:text-5xl md:text-[3.5rem] font-black tracking-[-0.045em] mb-4"
          style={{ color: LUXURY.text }}
        >
          {t("heroTitle")}
          <br />
          <span className="text-[#D9472C]">{t("heroTitleAccent")}</span>
        </h1>

        <p className="text-base sm:text-lg mb-7 max-w-xl mx-auto font-medium leading-relaxed" style={{ color: LUXURY.textSecondary }}>
          {t("heroSubtitle")}
        </p>

        {/* Single primary action — Booking/Airbnb pattern, no competing CTAs */}
        <div
          className="rounded-2xl md:rounded-full p-2 shadow-xl mb-5 text-left"
          style={{
            background: LUXURY.creamCard,
            border: `1px solid ${LUXURY.bronzeBorder}`,
            boxShadow: "0 14px 44px rgba(44,36,22,0.13)",
          }}
        >
          <form
            className="flex flex-col md:flex-row md:items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ color: LUXURY.textMuted }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl md:rounded-full pl-12 pr-4 py-3.5 md:py-4 text-base outline-none min-h-[48px] bg-transparent"
                style={{ color: LUXURY.text }}
                aria-label={t("searchPlaceholder")}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl md:rounded-full font-bold text-sm text-white transition-all hover:brightness-105 active:scale-[0.98] min-h-[48px] shrink-0"
              style={{
                background: "linear-gradient(135deg, #F26A3D 0%, #D9472C 100%)",
                boxShadow: "0 6px 18px rgba(217,71,44,0.28)",
              }}
            >
              <Search className="w-4 h-4" />
              {t("heroSearchCta")}
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <InspireMeButton destinations={inspireCities} variant="hero" />
          <Link
            href="/adventures"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-full text-sm font-bold border bg-white/65 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.98] w-full sm:w-auto"
            style={{
              color: LUXURY.text,
              borderColor: LUXURY.bronzeBorderStrong,
            }}
          >
            <Compass className="w-4 h-4 text-[#D9472C]" />
            {t("heroAdventuresCta")}
          </Link>
        </div>

      </div>

      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${LUXURY.section})` }}
      />
    </section>
  );
}

function HeroLuxuryCompass() {
  return (
    <div
      aria-hidden
      className="absolute left-1/2 top-[32%] sm:top-[36%] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-[4] w-[min(88vw,680px)] h-[min(42vw,320px)] sm:h-[min(58vw,460px)] md:w-[640px] md:h-[430px]"
    >
      <div
        className="absolute inset-0 opacity-[0.2] sm:opacity-[0.32]"
        style={{
          filter: "saturate(1.1) contrast(1.04)",
          WebkitMaskImage:
            "radial-gradient(ellipse 68% 62% at 50% 48%, #000 38%, transparent 82%)",
          maskImage:
            "radial-gradient(ellipse 68% 62% at 50% 48%, #000 38%, transparent 82%)",
        }}
      >
        <Image
          src={COMPASS_IMAGE}
          alt=""
          fill
          sizes="(max-width: 768px) 92vw, 640px"
          className="object-cover object-center"
          unoptimized={IMAGE_UNOPTIMIZED}
          priority
        />
      </div>

      {/* Rotating dial — hidden on small phones to keep hero clean */}
      <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[7.5rem] h-[7.5rem] sm:w-[11rem] sm:h-[11rem] md:w-[12.5rem] md:h-[12.5rem] hidden sm:block">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid rgba(58, 92, 110, 0.35)`,
            boxShadow: `0 0 0 5px ${COMPASS.glow}, 0 8px 32px rgba(42, 69, 85, 0.14)`,
          }}
        />
        <div
          className="absolute inset-[5px] rounded-full overflow-hidden relative"
          style={{ background: COMPASS.sky }}
        >
          <div className="hero-compass-dial-spin">
            <Image
              src={COMPASS_IMAGE}
              alt=""
              width={800}
              height={800}
              className="w-full h-full object-cover object-center scale-[2.8]"
              unoptimized={IMAGE_UNOPTIMIZED}
            />
          </div>
        </div>
        <div
          className="absolute inset-[5px] rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 42%, transparent 68%, rgba(255,255,255,0.08) 100%)",
          }}
        />
        <div className="hero-compass-needle absolute inset-0 flex items-center justify-center">
          <CompassNeedle />
        </div>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-10"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${COMPASS.silver}, ${COMPASS.deep})`,
            boxShadow: "0 0 0 2px rgba(58, 92, 110, 0.35)",
          }}
        />
      </div>
    </div>
  );
}

function CompassNeedle() {
  return (
    <svg viewBox="0 0 80 80" className="w-[58%] h-[58%]" fill="none" aria-hidden>
      <path d="M40 6 L34 40 L40 34 L46 40 Z" fill={COMPASS.teal} />
      <path d="M40 10 L37 38 L40 33 L43 38 Z" fill={COMPASS.silver} opacity="0.9" />
      <path d="M40 74 L34 40 L40 46 L46 40 Z" fill={COMPASS.deep} />
      <path d="M40 70 L37 42 L40 47 L43 42 Z" fill={COMPASS.navy} opacity="0.65" />
    </svg>
  );
}
