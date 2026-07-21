"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, AlertTriangle, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_AFFILIATE_CONFIG,
  AFFILIATE_CATEGORIES,
  type AffiliateConfig,
  type AffiliatePartner,
  type AffiliateCategory,
} from "@/lib/affiliates";
import { saveAffiliateConfig } from "@/actions/save-affiliate-config";

interface Props {
  initialConfig: AffiliateConfig;
}

function newPartnerId(category: AffiliateCategory) {
  return `${category}-${Date.now().toString(36)}`;
}

export function AffiliateConfigForm({ initialConfig }: Props) {
  const [config, setConfig] = useState<AffiliateConfig>(initialConfig);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function updatePartner(id: string, patch: Partial<AffiliatePartner>) {
    setConfig((prev) => ({
      ...prev,
      partners: prev.partners.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function addPartner(category: AffiliateCategory) {
    const cat = AFFILIATE_CATEGORIES.find((c) => c.id === category)!;
    setConfig((prev) => ({
      ...prev,
      partners: [
        ...prev.partners,
        {
          id: newPartnerId(category),
          category,
          label: cat.label,
          description: "",
          enabled: false,
          url_template: cat.example,
          sort_order: (prev.partners.length + 1) * 10,
        },
      ],
    }));
  }

  function removePartner(id: string) {
    setConfig((prev) => ({
      ...prev,
      partners: prev.partners.filter((p) => p.id !== id),
    }));
  }

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveAffiliateConfig(config);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Save failed.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Trip Extras on live site</h3>
            <p className="text-xs text-gray-500 mt-0.5">Shown in route panel after min places added.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((p) => ({ ...p, enabled: e.target.checked }))}
            />
            Active
          </label>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Min places</label>
          <input
            type="number"
            min={1}
            max={20}
            value={config.min_places}
            onChange={(e) =>
              setConfig((p) => ({ ...p, min_places: parseInt(e.target.value, 10) || 2 }))
            }
            className="mt-1 w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={config.disclosure_en}
            onChange={(e) => setConfig((p) => ({ ...p, disclosure_en: e.target.value }))}
            placeholder="Disclosure EN"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={config.disclosure_bg}
            onChange={(e) => setConfig((p) => ({ ...p, disclosure_bg: e.target.value }))}
            placeholder="Disclosure BG"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>
      </div>

      {config.partners.map((partner) => (
        <div key={partner.id} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase">{partner.category}</span>
            <div className="flex gap-2 items-center">
              <label className="text-xs flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={partner.enabled}
                  onChange={(e) => updatePartner(partner.id, { enabled: e.target.checked })}
                />
                On
              </label>
              <button type="button" onClick={() => removePartner(partner.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={partner.label}
              onChange={(e) => updatePartner(partner.id, { label: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder="Label"
            />
            <input
              value={partner.description}
              onChange={(e) => updatePartner(partner.id, { description: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder="Description"
            />
          </div>
          <textarea
            value={partner.url_template}
            onChange={(e) => updatePartner(partner.id, { url_template: e.target.value })}
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
            placeholder="Affiliate URL with {city} {country} {country_slug}"
          />
          <div className="flex gap-4 text-xs text-gray-500">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!partner.adventure_only}
                onChange={(e) =>
                  updatePartner(partner.id, {
                    adventure_only: e.target.checked,
                    city_only: e.target.checked ? false : partner.city_only,
                  })
                }
              />
              Road trip only
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!partner.city_only}
                onChange={(e) =>
                  updatePartner(partner.id, {
                    city_only: e.target.checked,
                    adventure_only: e.target.checked ? false : partner.adventure_only,
                  })
                }
              />
              City only
            </label>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {AFFILIATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => addPartner(cat.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed text-xs"
          >
            <Plus className="w-3 h-3" />
            {cat.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || saved}
        className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
        style={{ background: saved ? "#22c55e" : "oklch(0.72 0.13 82)" }}
      >
        {isPending ? "Saving..." : saved ? "Saved!" : "Save partners"}
      </button>
      {error && (
        <p className="text-red-500 text-sm flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => setConfig(DEFAULT_AFFILIATE_CONFIG)}
        className="block text-xs text-gray-400 underline"
      >
        Reset defaults
      </button>
    </div>
  );
}
