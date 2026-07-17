"use client";

import { useState } from "react";
import {
  Download,
  FileJson,
  Map,
  Printer,
  Navigation,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import type { TravelCollection } from "@/lib/collection-export";
import {
  exportCollectionJson,
  exportCollectionGpx,
  googleMapsRouteUrl,
  printCollection,
} from "@/lib/collection-export";

interface Props {
  collection: TravelCollection;
  variant?: "button" | "menu";
  className?: string;
}

export function CollectionDownloadMenu({
  collection,
  variant = "button",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

  const items = [
    {
      label: "JSON backup",
      hint: "Free · your data, forever",
      icon: FileJson,
      onClick: () => exportCollectionJson(collection),
    },
    {
      label: "GPX for GPS apps",
      hint: "Free · Garmin, Komoot, etc.",
      icon: Navigation,
      onClick: () => exportCollectionGpx(collection),
    },
    {
      label: "Google Maps route",
      hint: "Free · up to 10 stops",
      icon: Map,
      onClick: () => window.open(googleMapsRouteUrl(collection.places), "_blank"),
    },
    {
      label: "Print / Save PDF",
      hint: "Free · from your browser",
      icon: Printer,
      onClick: () => printCollection(collection),
    },
  ];

  if (variant === "menu") {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Download
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <DownloadPanel items={items} onClose={() => setOpen(false)} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-medium transition-all"
      >
        <Download className="w-3 h-3" />
        Download
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <DownloadPanel items={items} onClose={() => setOpen(false)} compact />
        </>
      )}
    </div>
  );
}

function DownloadPanel({
  items,
  onClose,
  compact = false,
}: {
  items: { label: string; hint: string; icon: React.ElementType; onClick: () => void }[];
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`absolute z-50 rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden ${
        compact ? "right-0 top-full mt-2 w-56" : "left-0 top-full mt-2 w-72"
      }`}
    >
      <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Export your collection
        </p>
      </div>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors"
        >
          <item.icon className="w-4 h-4 text-stone-500 mt-0.5 flex-shrink-0" />
          <span>
            <span className="block text-sm font-medium text-stone-800">{item.label}</span>
            <span className="block text-[10px] text-stone-400 mt-0.5">{item.hint}</span>
          </span>
        </button>
      ))}
      <p className="px-4 py-2 text-[10px] text-stone-400 border-t border-stone-100 bg-stone-50">
        Premium HD photo books — coming soon
      </p>
    </div>
  );
}
