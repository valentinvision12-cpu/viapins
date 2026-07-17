"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Trash2,
  Save,
  MapPin,
} from "lucide-react";
import type { DestinationDetail } from "@/actions/get-destinations";
import {
  updatePlaceNameAction,
  deletePlaceAction,
  updatePlaceMapsAction,
} from "@/actions/admin-destination";
import { DestinationsActions } from "@/components/admin/destinations-actions";
import { PlaceMapsEditor } from "@/components/admin/place-maps-editor";
import { readMapsOverride } from "@/lib/place-links";
import { slugify } from "@/lib/utils";

interface Props {
  destination: DestinationDetail;
  published: boolean;
}

export function DestinationEditClient({ destination, published }: Props) {
  const [places, setPlaces] = useState(destination.places);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const countrySlug = slugify(destination.country);
  const citySlug = slugify(destination.city);
  const publicUrl = `/en/explore/${countrySlug}/${citySlug}`;

  function startEdit(placeId: string, name: string) {
    setEditingId(placeId);
    setEditName(name);
    setMessage(null);
  }

  function saveEdit(placeId: string) {
    startTransition(async () => {
      const result = await updatePlaceNameAction(placeId, editName);
      if (result.success) {
        setPlaces((prev) =>
          prev.map((p) => (p.id === placeId ? { ...p, name: editName.trim() } : p))
        );
        setEditingId(null);
        setMessage("Записано.");
      } else {
        setMessage(result.error ?? "Грешка");
      }
    });
  }

  function removePlace(placeId: string) {
    if (!confirm("Изтрий това място?")) return;
    startTransition(async () => {
      const result = await deletePlaceAction(placeId, destination.id);
      if (result.success) {
        setPlaces((prev) => prev.filter((p) => p.id !== placeId));
      } else {
        setMessage(result.error ?? "Грешка");
      }
    });
  }

  function saveMaps(
    placeId: string,
    mapsUrl: string,
    mapsQuery: string
  ): Promise<void> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await updatePlaceMapsAction(
          placeId,
          destination.id,
          mapsUrl,
          mapsQuery
        );
        if (result.success) {
          setPlaces((prev) =>
            prev.map((p) => {
              if (p.id !== placeId) return p;
              const translations = { ...p.translations };
              for (const loc of ["en", "es", "fr", "de", "it"]) {
                const entry = { ...(translations[loc] ?? {}) };
                if (mapsUrl) entry.maps_url = mapsUrl;
                else delete entry.maps_url;
                if (mapsQuery) entry.maps_query = mapsQuery;
                else delete entry.maps_query;
                translations[loc] = entry;
              }
              return { ...p, translations };
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
        href="/admin/destinations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад към дестинации
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {destination.city}
            <span className="text-gray-400 font-normal text-lg ml-2">
              {destination.country}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {places.length} забележителности · Top 10
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DestinationsActions destinationId={destination.id} published={published} />
          <Link
            href={publicUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Виж на сайта
          </Link>
        </div>
      </div>

      {message && (
        <p className="text-sm text-emerald-600 mb-4">{message}</p>
      )}

      <div className="space-y-3">
        {places.map((place, i) => (
          <div
            key={place.id}
            className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {place.image_url ? (
                <Image
                  src={place.image_url}
                  alt={place.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <MapPin className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                #{i + 1}
              </span>
              {editingId === place.id ? (
                <div className="flex gap-2 mt-1">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(place.id)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-lg border text-xs"
                  >
                    Отказ
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(place.id, place.name)}
                  className="block text-left font-semibold text-gray-900 hover:text-blue-600 mt-0.5"
                  title="Кликни за редакция"
                >
                  {place.name}
                </button>
              )}
              <p className="text-xs text-gray-400 mt-1 truncate">
                {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
              </p>
              <PlaceMapsEditor
                lat={place.lat}
                lng={place.lng}
                name={place.name}
                city={destination.city}
                country={destination.country}
                mapsUrl={readMapsOverride(place.translations).maps_url ?? ""}
                mapsQuery={readMapsOverride(place.translations).maps_query ?? ""}
                onSave={(url, query) => saveMaps(place.id, url, query)}
                isPending={isPending}
              />
            </div>

            <button
              type="button"
              onClick={() => removePlace(place.id)}
              disabled={isPending}
              className="p-2 text-gray-300 hover:text-red-500 self-center"
              title="Изтрий"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {places.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          Няма места. Използвай „Замени“ от списъка или качи отново държавата.
        </p>
      )}
    </div>
  );
}
