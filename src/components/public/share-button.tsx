"use client";

import { useState } from "react";
import { Share2, Facebook, Link2, Check, Map, MessageCircle, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { SITE_DEFAULT_URL } from "@/lib/site-brand";
import type { TravelCollection } from "@/lib/collection-export";
import { googleMapsRouteUrl } from "@/lib/collection-export";
import {
  copyCollectionShareText,
  shareCollectionNative,
  whatsAppShareUrl,
} from "@/lib/collection-export";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  /** compact = icon only in corner */
  variant?: "default" | "compact" | "pill";
  className?: string;
}

function buildShareLinks(url: string, title: string, description?: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(description ? `${title} — ${description}` : title);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
  };
}

export function ShareButton({
  url,
  title,
  description,
  variant = "default",
  className = "",
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const links = buildShareLinks(url, title, description);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (variant === "compact") {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <ShareMenu links={links} copied={copied} onCopy={copyLink} onClose={() => setOpen(false)} />
          </>
        )}
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition-colors shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <ShareMenu links={links} copied={copied} onCopy={copyLink} onClose={() => setOpen(false)} />
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
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
      >
        <Share2 className="w-4 h-4" />
        Share destination
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ShareMenu links={links} copied={copied} onCopy={copyLink} onClose={() => setOpen(false)} dark />
        </>
      )}
    </div>
  );
}

function ShareMenu({
  links,
  copied,
  onCopy,
  onClose,
  dark = false,
}: {
  links: ReturnType<typeof buildShareLinks>;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
  dark?: boolean;
}) {
  const panel = dark
    ? "bg-stone-900/95 border-white/10 text-white"
    : "bg-white border-stone-200 text-stone-800 shadow-xl";
  const item = dark
    ? "hover:bg-white/10 text-white/90"
    : "hover:bg-stone-50 text-stone-700";

  return (
    <div
      className={`absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-xl border py-1.5 ${panel}`}
      onClick={(e) => e.stopPropagation()}
    >
      <a
        href={links.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm ${item}`}
        onClick={onClose}
      >
        <Facebook className="w-4 h-4" />
        Facebook
      </a>
      <a
        href={links.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm ${item}`}
        onClick={onClose}
      >
        <Share2 className="w-4 h-4" />
        X / Twitter
      </a>
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm ${item}`}
        onClick={onClose}
      >
        <Share2 className="w-4 h-4" />
        WhatsApp
      </a>
      <button
        type="button"
        onClick={onCopy}
        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left ${item}`}
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
        {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  );
}

/** Build absolute page URL for sharing */
export function sharePageUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : SITE_DEFAULT_URL);
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

interface CollectionShareProps {
  collection: TravelCollection;
  exploreUrl: string;
  className?: string;
}

export function CollectionShareButton({ collection, exploreUrl, className = "" }: CollectionShareProps) {
  const t = useTranslations("myTrip");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"list" | "link" | null>(null);
  const fullWidth = !className.includes("w-auto");

  async function handleNativeShare() {
    const result = await shareCollectionNative(collection, exploreUrl);
    if (result === "shared" || result === "cancelled") {
      setOpen(false);
      return;
    }
    setOpen(true);
  }

  async function copyList() {
    const ok = await copyCollectionShareText(collection);
    if (ok) {
      setCopied("list");
      setTimeout(() => setCopied(null), 2000);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(exploreUrl);
      setCopied("link");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (typeof navigator !== "undefined" && "share" in navigator) {
            void handleNativeShare();
          } else {
            setOpen((v) => !v);
          }
        }}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50 ${fullWidth ? "w-full" : ""}`}
      >
        <Share2 className="h-4 w-4" />
        {t("shareCollection")}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
            <div className="border-b border-stone-100 bg-stone-50 px-4 py-2.5">
              <p className="text-[11px] font-semibold text-stone-600">{t("shareCollectionHint")}</p>
            </div>
            <a
              href={whatsAppShareUrl(collection)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => setOpen(false)}
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              WhatsApp
            </a>
            <a
              href={googleMapsRouteUrl(collection.places)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => setOpen(false)}
            >
              <Map className="h-4 w-4 text-amber-700" />
              {t("shareOpenRoute")}
            </a>
            <button
              type="button"
              onClick={() => void copyList()}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-50"
            >
              {copied === "list" ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              {copied === "list" ? t("shareCopied") : t("shareCopyList")}
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-50"
            >
              {copied === "link" ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
              {copied === "link" ? t("shareCopied") : t("shareCopyLink")}
            </button>
            {"share" in navigator && (
              <button
                type="button"
                onClick={() => void handleNativeShare()}
                className="flex w-full items-center gap-2.5 border-t border-stone-100 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-50"
              >
                <Smartphone className="h-4 w-4" />
                {t("shareNative")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
