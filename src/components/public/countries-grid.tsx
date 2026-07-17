"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, Compass, Globe2 } from "lucide-react";
import { CountryCard } from "@/components/public/country-card";
import { ContinentBadge } from "@/components/public/continent-badge";
import type { CountryCard as CountryCardType } from "@/actions/get-destinations";
import { EUROPE_COUNTRY_COUNT } from "@/lib/country-continents";
import { LUXURY } from "@/lib/luxury-palette";

interface Props {
  countries: CountryCardType[];
  seasonFilter: string | null;
}

function ContinentSectionBanner({
  continent,
  countBadge,
  countLabel,
  title,
  description,
  complete,
}: {
  continent: "europe" | "asia";
  countBadge: string;
  countLabel: string;
  title: string;
  description: string;
  complete?: boolean;
}) {
  const isEurope = continent === "europe";

  return (
    <div
      className="mb-8 rounded-2xl border px-5 py-4 md:px-6 md:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      style={{
        background: LUXURY.creamCard,
        borderColor: LUXURY.bronzeBorder,
      }}
    >
      <div className="flex items-start gap-3">
        {complete && isEurope && (
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(16, 185, 129, 0.12)" }}
          >
            <Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <ContinentBadge continent={continent} variant="section" showCheck={complete && isEurope} />
            {complete && isEurope && (
              <span className="text-xs font-medium" style={{ color: LUXURY.textMuted }}>
                {countLabel}
              </span>
            )}
          </div>
          <p className="text-sm md:text-base font-semibold" style={{ color: LUXURY.text }}>
            {title}
          </p>
          <p className="text-sm mt-0.5" style={{ color: LUXURY.textSecondary }}>
            {description}
          </p>
        </div>
      </div>
      <div
        className="text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-full self-start sm:self-center"
        style={{
          color: LUXURY.bronze,
          background: LUXURY.bronzeLight,
          border: `1px solid ${LUXURY.bronzeBorder}`,
        }}
      >
        {countBadge}
      </div>
    </div>
  );
}

export function CountriesGrid({ countries, seasonFilter }: Props) {
  const t = useTranslations("home");
  const tContinents = useTranslations("continents");

  const filtered = useMemo(() => {
    if (!seasonFilter) return countries;
    return countries.filter((c) =>
      c.tags.map((tag) => tag.toLowerCase()).includes(seasonFilter)
    );
  }, [countries, seasonFilter]);

  const europeCountries = useMemo(
    () => filtered.filter((c) => c.continent === "europe"),
    [filtered]
  );

  const asiaCountries = useMemo(
    () => filtered.filter((c) => c.continent === "asia"),
    [filtered]
  );

  return (
    <section id="destinations" className="py-10 md:py-14 px-6" style={{ background: LUXURY.section }}>
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: LUXURY.text }}>
              {t("countriesTitle")}
            </h2>
            <p className="text-sm mt-1" style={{ color: LUXURY.textMuted }}>
              {filtered.length} {t("countriesCount")}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: LUXURY.textMuted }} />
            <p className="text-lg" style={{ color: LUXURY.textSecondary }}>
              {t("countriesEmpty")}
            </p>
          </div>
        ) : (
          <>
            {europeCountries.length > 0 && (
              <>
                <ContinentSectionBanner
                  continent="europe"
                  countBadge={`${europeCountries.length} ${t("countriesCount")}`}
                  countLabel={tContinents("europeComplete")}
                  title={tContinents("europeSectionTitle")}
                  description={tContinents("europeSectionDesc", { count: EUROPE_COUNTRY_COUNT })}
                  complete
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {europeCountries.map((country, i) => (
                    <CountryCard key={country.slug} country={country} index={i} />
                  ))}
                </div>
              </>
            )}

            {asiaCountries.length > 0 ? (
              <>
                <ContinentSectionBanner
                  continent="asia"
                  countBadge={`${asiaCountries.length} ${t("countriesCount")}`}
                  countLabel={tContinents("asiaLive")}
                  title={tContinents("asiaSectionTitle")}
                  description={tContinents("asiaSectionDesc")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {asiaCountries.map((country, i) => (
                    <CountryCard key={country.slug} country={country} index={i} />
                  ))}
                </div>
              </>
            ) : (
              <div className="pt-4 border-t" style={{ borderColor: LUXURY.bronzeBorder }}>
                <div className="flex items-center gap-2 mb-4">
                  <Globe2 className="w-4 h-4" style={{ color: LUXURY.bronze }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: LUXURY.textMuted }}>
                    {tContinents("nextUp")}
                  </span>
                </div>
                <div
                  className="rounded-2xl border border-dashed px-6 py-8 md:py-10 text-center"
                  style={{
                    background: LUXURY.creamCard,
                    borderColor: LUXURY.bronzeBorderStrong,
                  }}
                >
                  <div className="inline-flex mb-3">
                    <ContinentBadge continent="asia" variant="section" showCheck={false} />
                  </div>
                  <p className="text-lg font-bold" style={{ color: LUXURY.text }}>
                    {tContinents("asiaComingTitle")}
                  </p>
                  <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: LUXURY.textSecondary }}>
                    {tContinents("asiaComingDesc")}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
