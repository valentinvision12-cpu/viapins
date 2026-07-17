"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { saveAdConfig, type AdConfig } from "@/lib/ads";

interface AdSlot {
  key: keyof AdConfig;
  label: string;
  description: string;
  size: string;
  position: string;
}

const AD_SLOTS: AdSlot[] = [
  {
    key: "sticky_footer",
    label: "Sticky Footer",
    description: "Фиксирана лента в дъното на всяка страница. Висока видимост.",
    size: "728×90 (Leaderboard)",
    position: "Долу, fixed",
  },
  {
    key: "smart_header",
    label: "Smart Header",
    description: "Появява се под навигацията само при скролиране нагоре. Не дразни потребителите.",
    size: "728×90 (Leaderboard)",
    position: "Горе, при scroll-up",
  },
  {
    key: "sticky_sidebar",
    label: "Sticky Sidebar",
    description: "Sidebar реклама на страниците с дестинации. Само на desktop.",
    size: "300×250 (Medium Rectangle)",
    position: "Дясно, sticky",
  },
  {
    key: "floating_video",
    label: "Floating Video",
    description: "Outstream видео реклама в долния десен ъгъл. Появява се след 8 секунди.",
    size: "300×180 (Video)",
    position: "Долу-дясно, с X бутон",
  },
];

interface Props {
  initialConfig: AdConfig;
  isConfigured: boolean;
}

export function AdConfigForm({ initialConfig }: Props) {
  const [config, setConfig] = useState<AdConfig>(initialConfig);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveAdConfig(config);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Грешка при запазване.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {AD_SLOTS.map((slot) => (
        <div
          key={slot.key}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          {/* Slot header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-gray-900 font-semibold text-sm">{slot.label}</h3>
                {config[slot.key].trim().length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                    АКТИВНА
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs">{slot.description}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-gray-400 text-[10px] font-medium">{slot.size}</p>
              <p className="text-gray-300 text-[10px] mt-0.5">{slot.position}</p>
            </div>
          </div>

          {/* Script textarea */}
          <textarea
            value={config[slot.key]}
            onChange={(e) => setConfig((prev) => ({ ...prev, [slot.key]: e.target.value }))}
            placeholder={`<!-- Поставете ${slot.label} рекламен код тук -->`}
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-gray-700 text-xs font-mono placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
          />
        </div>
      ))}

      {/* Save button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={isPending || saved}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 text-white shadow-sm"
          style={{
            background: saved ? "#22c55e" : "oklch(0.72 0.13 82)",
          }}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {isPending ? "Запазване..." : saved ? "Запазено!" : "Запази промените"}
        </button>

        {error && (
          <div className="flex items-center gap-1.5 text-red-500 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 leading-relaxed">
        <strong className="text-gray-700">Как да настроите Google AdSense:</strong>
        <ol className="mt-1.5 space-y-1 pl-4 list-decimal">
          <li>Отидете на Google AdSense → Ads → By ad unit → Display ads</li>
          <li>Създайте нова рекламна единица с подходящия размер</li>
          <li>Копирайте предоставения код и го поставете тук</li>
          <li>Кликнете &quot;Запази промените&quot;</li>
        </ol>
      </div>
    </div>
  );
}
