"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  Building2,
  Car,
  Plane,
  Shield,
  Smartphone,
  Ticket,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { AffiliateCategory, AffiliatePartner, AffiliateConfig } from "@/lib/affiliates";
import {
  buildAffiliateUrl,
  getActivePartners,
  type AffiliateLinkContext,
} from "@/lib/affiliates";

const AffiliateContext = createContext<AffiliateConfig | null>(null);

export function AffiliateProvider({
  config,
  children,
}: {
  config: AffiliateConfig;
  children: ReactNode;
}) {
  return (
    <AffiliateContext.Provider value={config}>{children}</AffiliateContext.Provider>
  );
}

export function useAffiliateConfig() {
  const ctx = useContext(AffiliateContext);
  if (!ctx) {
    throw new Error("useAffiliateConfig must be used inside AffiliateProvider");
  }
  return ctx;
}

const ICONS: Record<AffiliateCategory, React.ElementType> = {
  hotels: Building2,
  flights: Plane,
  car_rental: Car,
  insurance: Shield,
  esim: Smartphone,
  tours: Ticket,
};

interface Props {
  city: string;
  country: string;
  countrySlug?: string;
  placeCount: number;
  isAdventure: boolean;
  lat?: number;
  lng?: number;
}

export function TripExtrasSection({
  city,
  country,
  countrySlug,
  placeCount,
  isAdventure,
  lat,
  lng,
}: Props) {
  const config = useAffiliateConfig();
  const locale = useLocale();
  const t = useTranslations("affiliates");
  const [open, setOpen] = useState(false);

  const ctx: AffiliateLinkContext = {
    city,
    country,
    country_slug: countrySlug,
    locale,
    lat,
    lng,
    is_adventure: isAdventure,
  };

  const partners = getActivePartners(config, ctx, placeCount);
  if (!partners.length) return null;

  const disclosure =
    locale === "bg" ? config.disclosure_bg : config.disclosure_en;

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-stone-100 bg-stone-50/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-stone-800 text-sm font-semibold">
          {t("sectionTitle")}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-stone-100/80">
          {partners.map((p) => (
            <PartnerRow key={p.id} partner={p} ctx={ctx} />
          ))}
          <p className="text-[10px] text-stone-400 text-center pt-2 leading-relaxed px-1">
            {disclosure}
          </p>
        </div>
      )}
    </div>
  );
}

function PartnerRow({
  partner,
  ctx,
}: {
  partner: AffiliatePartner;
  ctx: AffiliateLinkContext;
}) {
  const href = buildAffiliateUrl(partner.url_template, ctx);
  if (!href) return null;

  const Icon = ICONS[partner.category];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-stone-100 hover:border-stone-200 transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-stone-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-stone-900 text-sm font-medium leading-tight">
          {partner.label}
        </p>
        <p className="text-stone-400 text-xs truncate">{partner.description}</p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 flex-shrink-0" />
    </a>
  );
}
