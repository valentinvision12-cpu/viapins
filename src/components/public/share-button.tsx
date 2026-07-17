"use client";

import { useState } from "react";
import { Share2, Facebook, Link2, Check } from "lucide-react";
import { SITE_DEFAULT_URL } from "@/lib/site-brand";

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
