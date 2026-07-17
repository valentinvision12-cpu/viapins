"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Upload,
  Compass,
  Car,
} from "lucide-react";
import type { AdventureCollection } from "@/lib/adventure-types";
import {
  toggleAdventurePublishedAction,
  importAdventureFromSeedAction,
  updateAdventureStopNameAction,
  updateAdventureStopMapsAction,
} from "@/actions/admin-adventure";
import { PlaceMapsEditor } from "@/components/admin/place-maps-editor";
import { readMapsOverride } from "@/lib/place-links";

interface Props {
  adventure: AdventureCollection & { published: boolean };
}

export function AdventureEditClient({ adventure }: Props) {
  const [stops, setStops] = useState(adventure.places);
  const [published, setPublished] = useState(adventure.published);
  const [isPending, startTransition] = useTransition();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function togglePublished() {
    startTransition(async () => {
      const result = await toggleAdventurePublishedAction(adventure.slug, published);
      if (result.success) setPublished(!published);
      else setMessage(result.error ?? "Грешка");
    });
  }

  function reimportFromSeed() {
    startTransition(async () => {
      const result = await importAdventureFromSeedAction(adventure.slug);
      if (result.success) {
        setMessage(`Качено: ${result.stopCount} спирки`);
        window.location.reload();
      } else {
        setMessage(result.error ?? "Грешка");
      }
    });
  }

  function saveStopName(index: number) {
    startTransition(async () => {
      const result = await updateAdventureStopNameAction(
        adventure.slug,
        index,
        editName
      );
      if (result.success) {
        setStops((prev) =>
          prev.map((s, i) => (i === index ? { ...s, name: editName.trim() } : s))
        );
        setEditingIdx(null);
      } else {
        setMessage(result.error ?? "Грешка");
      }
    });
  }

  function saveStopMaps(
    index: number,
    mapsUrl: string,
    mapsQuery: string
  ): Promise<void> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await updateAdventureStopMapsAction(
          adventure.slug,
          index,
          mapsUrl,
          mapsQuery
        );
        if (result.success) {
          setStops((prev) =>
            prev.map((s, i) => {
              if (i !== index) return s;
              const translations = { ...(s.translations ?? {}) };
              for (const loc of ["en", "es", "fr", "de", "it"]) {
                const entry = { ...(translations[loc] ?? {}) };
                if (mapsUrl) entry.maps_url = mapsUrl;
                else delete entry.maps_url;
                if (mapsQuery) entry.maps_query = mapsQuery;
                else delete entry.maps_query;
                translations[loc] = entry;
              }
              return { ...s, translations };
            })
          );
          setMessage("Google Maps линкът е записан.");
        } else {
          setMessage(result.error ?? "Грешка");
        }
        resolve();
      });
    });
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/admin/adventures"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Всички Adventures
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-bold text-orange-600 uppercase">Adventure</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{adventure.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{adventure.subtitle}</p>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Car className="w-3.5 h-3.5" />
            {stops.length} спирки · {adventure.totalDays} дни · {adventure.country}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={togglePublished}
            disabled={isPending}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              published
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            {published ? "Публикуван" : "Скрит"}
          </button>
          <Link
            href={`/en/explore/${adventure.slug}/adventure`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border hover:bg-gray-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Сайт
          </Link>
          <button
            type="button"
            onClick={reimportFromSeed}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-orange-500 text-white font-medium"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Презареди от seed
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-orange-600 mb-4">{message}</p>}

      <div className="space-y-3">
        {stops
          .slice()
          .sort((a, b) => a.order_index - b.order_index)
          .map((stop, i) => (
            <div
              key={stop.id}
              className="flex gap-4 p-4 bg-white rounded-xl border border-orange-100"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0">
                {stop.image_url ? (
                  <Image
                    src={stop.image_url}
                    alt={stop.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-orange-300 font-bold">
                    {i + 1}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-orange-500">
                  Ден {stop.day} · Спирка {i + 1}
                </span>
                {editingIdx === i ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => saveStopName(i)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 text-white"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIdx(i);
                      setEditName(stop.name);
                    }}
                    className="block font-semibold text-gray-900 hover:text-orange-600 mt-0.5 text-left"
                  >
                    {stop.name}
                  </button>
                )}
                <p className="text-xs text-gray-400">{stop.region}</p>
                <PlaceMapsEditor
                  lat={stop.lat}
                  lng={stop.lng}
                  name={stop.name}
                  city={stop.region}
                  country={adventure.country}
                  mapsUrl={readMapsOverride(stop.translations).maps_url ?? ""}
                  mapsQuery={readMapsOverride(stop.translations).maps_query ?? ""}
                  onSave={(url, query) =>
                    saveStopMaps(stops.findIndex((s) => s.id === stop.id), url, query)
                  }
                  isPending={isPending}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
