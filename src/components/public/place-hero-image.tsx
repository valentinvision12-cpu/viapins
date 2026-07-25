"use client";

import { useEffect, useState } from "react";
import { isBadImageUrl } from "@/lib/wiki-image";
import { SafeCoverImage } from "@/components/public/safe-cover-image";

interface Props {
  placeId: string;
  name: string;
  imageUrl: string;
  city: string;
}

/** Place page hero — recovers via /api/places/:id/image when the stored URL is dead. */
export function PlaceHeroImage({ placeId, name, imageUrl, city }: Props) {
  const initial =
    imageUrl?.trim() && !isBadImageUrl(imageUrl) ? imageUrl.trim() : "";
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    const next =
      imageUrl?.trim() && !isBadImageUrl(imageUrl) ? imageUrl.trim() : "";
    setSrc(next);
  }, [imageUrl]);

  useEffect(() => {
    if (imageUrl?.trim() && !isBadImageUrl(imageUrl)) return;
    let cancelled = false;
    fetch(`/api/places/${placeId}/image`)
      .then((r) => r.json())
      .then((data: { url?: string }) => {
        if (!cancelled && data.url && !isBadImageUrl(data.url)) setSrc(data.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placeId, imageUrl]);

  return (
    <SafeCoverImage
      src={src}
      alt={name}
      fallbackSeed={`${name}-${city}`}
      sizes="100vw"
      priority
      width={1600}
      height={900}
      gradientClassName="bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700"
      onPrimaryError={() => {
        fetch(`/api/places/${placeId}/image?refresh=1`)
          .then((r) => r.json())
          .then((data: { url?: string }) => {
            if (data.url && !isBadImageUrl(data.url)) setSrc(data.url);
          })
          .catch(() => {});
      }}
    />
  );
}
