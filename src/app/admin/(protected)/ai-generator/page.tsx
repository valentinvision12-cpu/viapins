import { Sparkles, Info } from "lucide-react";
import { CountryGeneratorForm } from "@/components/admin/country-generator-form";

export const metadata = { title: "Генерирай държава" };

function ApiKeyStatus({
  name,
  value,
  docsUrl,
}: {
  name: string;
  value: string | undefined;
  docsUrl: string;
}) {
  const isSet = !!value && !value.startsWith("placeholder") && value !== "";
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
        isSet
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-amber-50 border-amber-200 text-amber-700"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isSet ? "bg-emerald-500" : "bg-amber-400"}`}
      />
      {name}:{" "}
      {isSet ? (
        "✓ Конфигуриран"
      ) : (
        <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="underline">
          Нуждае се от ключ
        </a>
      )}
    </div>
  );
}

export default function AiGeneratorPage() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Sparkles className="w-5 h-5 text-[oklch(0.72_0.13_82)]" />
          <h1 className="text-xl font-bold text-gray-900">Генерирай държава</h1>
        </div>
        <p className="text-sm text-gray-500 max-w-2xl">
          Въведи държава → AI генерира 10 града × 10 места + adventure → натискаш{" "}
          <strong className="text-gray-700">Качи на сайта</strong>. Управляваш всичко от Дестинации.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-2">
          <Info className="w-3.5 h-3.5" />
          <span className="font-medium">API:</span>
        </div>
        <ApiKeyStatus
          name="Anthropic (Claude)"
          value={anthropicKey}
          docsUrl="https://console.anthropic.com/settings/keys"
        />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-emerald-50 border-emerald-200 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Wikipedia + Wikimedia: безплатни
        </div>
      </div>

      <CountryGeneratorForm />
    </div>
  );
}
