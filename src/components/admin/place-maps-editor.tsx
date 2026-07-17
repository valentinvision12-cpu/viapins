"use client";

import { useState } from "react";
import { ExternalLink, Loader2, MapPin, RotateCcw, Save } from "lucide-react";
import { isValidGoogleMapsLink, resolveMapsHref } from "@/lib/place-links";

interface PlaceMapsEditorProps {
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
  mapsUrl: string;
  mapsQuery: string;
  onSave: (mapsUrl: string, mapsQuery: string) => Promise<void>;
  isPending: boolean;
}

export function PlaceMapsEditor({
  lat,
  lng,
  name,
  city,
  country,
  mapsUrl: initialUrl,
  mapsQuery: initialQuery,
  onSave,
  isPending,
}: PlaceMapsEditorProps) {
  const [open, setOpen] = useState(false);
  const [mapsUrl, setMapsUrl] = useState(initialUrl);
  const [mapsQuery, setMapsQuery] = useState(initialQuery);

  const autoHref = resolveMapsHref({ lat, lng, name, city, country });
  const previewHref = resolveMapsHref({
    lat,
    lng,
    name,
    city,
    country,
    mapsQuery: mapsQuery || undefined,
    mapsUrl: mapsUrl || undefined,
  });
  const hasOverride = Boolean(initialUrl || initialQuery);

  async function handleSave() {
    if (mapsUrl.trim() && !isValidGoogleMapsLink(mapsUrl)) {
      alert("Линкът трябва да е валиден Google Maps URL (google.com/maps или maps.app.goo.gl).");
      return;
    }
    await onSave(mapsUrl.trim(), mapsQuery.trim());
  }

  function handleReset() {
    setMapsUrl("");
    setMapsQuery("");
    void onSave("", "");
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
          hasOverride
            ? "text-blue-600 hover:text-blue-800"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <MapPin className="w-3 h-3" />
        Google Maps
        {hasOverride && (
          <span className="px-1 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] uppercase">
            custom
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Директен линк (приоритет)
            </label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://www.google.com/maps/place/..."
              className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-xs bg-white"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">
              Постави линк от Google Maps — отваря точно това място.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Търсене (ако няма директен линк)
            </label>
            <input
              type="text"
              value={mapsQuery}
              onChange={(e) => setMapsQuery(e.target.value)}
              placeholder={`${name}, ${city}, ${country}`}
              className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-xs bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-white text-[11px] text-gray-600 hover:text-blue-600"
            >
              <ExternalLink className="w-3 h-3" />
              Тествай
            </a>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-medium disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Запази
            </button>
            {(mapsUrl || mapsQuery || hasOverride) && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:text-red-600"
              >
                <RotateCcw className="w-3 h-3" />
                Авто
              </button>
            )}
          </div>

          {!mapsUrl && !mapsQuery && (
            <p className="text-[10px] text-gray-400 truncate" title={autoHref}>
              Авто: {autoHref}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
