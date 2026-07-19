"use client";

import { CountryCoverSlideshow } from "@/components/public/country-cover-slideshow";
import { fallbackImageUrl } from "@/lib/fallback-image";

interface Props {
  country: string;
  coverImages: string[];
  coverImage: string;
}

export function CountryHeroCover({ country, coverImages, coverImage }: Props) {
  const images = [
    ...new Set(
      [coverImage, ...coverImages]
        .map((u) => u?.trim())
        .filter((u): u is string => !!u)
    ),
  ];
  const slides =
    images.length > 0
      ? images.slice(0, 3)
      : [fallbackImageUrl(`${country}-travel`, 1600, 900)];

  return (
    <CountryCoverSlideshow
      images={slides}
      alt={`${country} travel guide`}
      className="absolute inset-0"
      intervalMs={slides.length > 1 ? 6000 : 0}
      sizes="100vw"
      priority
    />
  );
}
