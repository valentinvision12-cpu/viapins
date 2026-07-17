"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Compass, Upload, Loader2, ExternalLink, Car } from "lucide-react";
import {
  importAdventureFromSeedAction,
  type AdminAdventureRow,
} from "@/actions/admin-adventure";
import { useState } from "react";

function ImportSeedButton({ slug, label }: { slug: string; label: string }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const r = await importAdventureFromSeedAction(slug);
            setMsg(r.success ? `✓ ${r.stopCount} спирки` : r.error ?? "Грешка");
            if (r.success) window.location.reload();
          })
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        {label}
      </button>
      {msg && !msg.startsWith("✓") && (
        <p className="text-[10px] text-red-500 mt-1 max-w-xs">{msg}</p>
      )}
    </div>
  );
}

export function AdventuresAdminList({
  adventures,
  seedAvailable,
}: {
  adventures: AdminAdventureRow[];
  seedAvailable: string[];
}) {
  const uploaded = new Set(adventures.map((a) => a.slug));

  return (
    <div className="space-y-6">
      {adventures.length === 0 && (
        <div className="p-6 rounded-xl bg-orange-50 border border-orange-100 text-sm text-orange-800">
          <p className="font-medium mb-2">Няма adventure в Supabase</p>
          <p className="text-xs text-orange-700/80 mb-4">
            Първо пусни <code className="bg-orange-100 px-1 rounded">006_adventure_collections.sql</code> в
            Supabase SQL Editor, после качи от seed:
          </p>
          <div className="flex flex-wrap gap-2">
            {seedAvailable.map((slug) => (
              <ImportSeedButton key={slug} slug={slug} label={`Качи ${slug}`} />
            ))}
          </div>
        </div>
      )}

      {adventures.map((adv) => (
        <Link
          key={adv.slug}
          href={`/admin/adventures/${adv.slug}`}
          className="block p-5 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-600">ADVENTURE</span>
                {!adv.published && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    скрит
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{adv.country}</h2>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{adv.title}</p>
              <p className="text-xs text-orange-600/80 mt-2 flex items-center gap-1">
                <Car className="w-3 h-3" />
                {adv.stopCount} спирки · {adv.totalDays} дни
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300" />
          </div>
        </Link>
      ))}

      {seedAvailable.filter((s) => !uploaded.has(s)).length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3">Seed файлове — качи adventure:</p>
          <div className="flex flex-wrap gap-2">
            {seedAvailable
              .filter((s) => !uploaded.has(s))
              .map((slug) => (
                <ImportSeedButton key={slug} slug={slug} label={`+ ${slug}`} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
