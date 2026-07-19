"use client";

import { useState } from "react";
import {
  Download,
  FileJson,
  Map,
  Navigation,
  ChevronDown,
  BookImage,
  FileCode,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { TravelCollection } from "@/lib/collection-export";
import {
  exportCollectionJson,
  exportCollectionGpx,
  googleMapsRouteUrl,
  openTravelAlbumPdf,
  downloadTravelAlbumHtml,
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
  const t = useTranslations("myTrip");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fullWidth = !className.includes("w-auto");

  function runAlbumPdf() {
    setLoading(true);
    try {
      openTravelAlbumPdf(collection);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  }

  const items = [
    {
      label: t("downloadAlbumPdf"),
      hint: t("downloadAlbumPdfHint"),
      icon: BookImage,
      primary: true,
      onClick: runAlbumPdf,
    },
    {
      label: t("downloadAlbumHtml"),
      hint: t("downloadAlbumHtmlHint"),
      icon: FileCode,
      onClick: () => downloadTravelAlbumHtml(collection),
    },
    {
      label: t("downloadGpx"),
      hint: t("downloadGpxHint"),
      icon: Navigation,
      onClick: () => exportCollectionGpx(collection),
    },
    {
      label: t("downloadMapsRoute"),
      hint: t("downloadMapsRouteHint"),
      icon: Map,
      onClick: () => window.open(googleMapsRouteUrl(collection.places), "_blank"),
    },
    {
      label: t("downloadJson"),
      hint: t("downloadJsonHint"),
      icon: FileJson,
      onClick: () => exportCollectionJson(collection),
    },
  ];

  if (variant === "menu") {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-stone-800 disabled:opacity-70 ${fullWidth ? "w-full" : ""}`}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {t("downloadAlbum")}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <DownloadPanel items={items} onClose={() => setOpen(false)} title={t("downloadAlbumTitle")} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={runAlbumPdf}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition-all hover:bg-amber-100 disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
        {t("downloadAlbum")}
      </button>
    </div>
  );
}

function DownloadPanel({
  items,
  onClose,
  title,
}: {
  items: {
    label: string;
    hint: string;
    icon: React.ElementType;
    primary?: boolean;
    onClick: () => void;
  }[];
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
      <div className="border-b border-stone-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5">
        <p className="text-[11px] font-semibold text-amber-900">{title}</p>
      </div>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
            item.primary ? "bg-amber-50/50" : ""
          }`}
        >
          <item.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-500" />
          <span>
            <span className="block text-sm font-medium text-stone-800">{item.label}</span>
            <span className="mt-0.5 block text-[10px] text-stone-400">{item.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
