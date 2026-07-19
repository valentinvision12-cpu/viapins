"use client";

import { CountryCoverSlideshow } from "@/components/public/country-cover-slideshow";
import { fallbackImageUrl } from "@/lib/fallback-image";

interface Props {
  country: string;
  coverImages: string[];
  coverImage: string;
}

export function CountryHeroCover({ country, coverImages, coverImage }: Props) {
  const primaryImage =
    coverImage || coverImages.find(Boolean) || fallbackImageUrl(`${country}-travel`, 1600, 900);

  return (
    <>
      <CountryCoverSlideshow
        images={[primaryImage]}
        alt={`${country} travel guide`}
        className="absolute inset-0"
        intervalMs={0}
        sizes="100vw"
        priority
      />
    </>
  );
}
