"use client";

import { CountryCoverSlideshow, COVER_SLIDE_INTERVAL_HERO_MS } from "@/components/public/country-cover-slideshow";
import { CountryFlag } from "@/components/public/country-flag";

interface Props {
  country: string;
  coverImages: string[];
  coverImage: string;
}

export function CountryHeroCover({ country, coverImages, coverImage }: Props) {
  const slides =
    coverImages.length > 0 ? coverImages : coverImage ? [coverImage] : [];

  return (
    <>
      {slides.length > 0 ? (
        <CountryCoverSlideshow
          images={slides}
          alt={country}
          className="absolute inset-0"
          intervalMs={COVER_SLIDE_INTERVAL_HERO_MS}
          sizes="100vw"
          priority
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.12 0.10 260) 0%, oklch(0.20 0.12 275) 100%)",
          }}
        />
      )}

      <div className="absolute top-6 right-6 z-20">
        <CountryFlag country={country} size="xl" />
      </div>
    </>
  );
}
