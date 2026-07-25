"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  listThinPlacesAction,
  runLinkingBatchChunkAction,
  validateSchemaSampleAction,
  validateSchemaUrlAction,
} from "@/actions/seo-growth";
import type { LinkingBatchState, ThinPlaceRow } from "@/lib/seo/seo-growth";
import type { SchemaValidateResult } from "@/lib/seo/schema-validate";
import type { SchemaPageType } from "@/lib/schema/types";

type Props = {
  initialBatch: LinkingBatchState;
};

const SAMPLE_TYPES: SchemaPageType[] = [
  "home",
  "country",
  "city",
  "attraction",
  "guide",
  "trip",
  "collection",
];

function Feedback({
  state,
  error,
  message,
}: {
  state: "idle" | "saving" | "saved" | "error";
  error?: string;
  message?: string;
}) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Работи…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> {message || "Готово"}
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
        <AlertCircle className="h-3.5 w-3.5" /> {error || "Грешка"}
      </span>
    );
  }
  return null;
}

export function SeoGrowthPanel({ initialBatch }: Props) {
  const [batch, setBatch] = useState(initialBatch);
  const [batchState, setBatchState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [batchError, setBatchError] = useState("");

  const [thinItems, setThinItems] = useState<ThinPlaceRow[]>([]);
  const [thinOffset, setThinOffset] = useState(0);
  const [thinHasMore, setThinHasMore] = useState(false);
  const [thinState, setThinState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [thinError, setThinError] = useState("");

  const [schemaUrl, setSchemaUrl] = useState("/en/explore/france/paris");
  const [schemaResult, setSchemaResult] = useState<SchemaValidateResult | null>(
    null
  );
  const [schemaState, setSchemaState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [schemaError, setSchemaError] = useState("");
  const [sampleType, setSampleType] = useState<SchemaPageType>("attraction");

  const [isPending, startTransition] = useTransition();

  function runChunk(reset?: boolean) {
    setBatchState("saving");
    setBatchError("");
    startTransition(async () => {
      const r = await runLinkingBatchChunkAction({ reset, chunkSize: 25 });
      if (!r.success) {
        setBatchState("error");
        setBatchError(r.error);
        return;
      }
      if (r.data) setBatch(r.data);
      setBatchState("saved");
    });
  }

  function loadThin(nextOffset = 0, append = false) {
    setThinState("saving");
    setThinError("");
    startTransition(async () => {
      const r = await listThinPlacesAction({ limit: 40, offset: nextOffset });
      if (!r.success || !r.data) {
        setThinState("error");
        setThinError(r.success ? "Няма данни" : r.error);
        return;
      }
      setThinItems((prev) =>
        append ? [...prev, ...r.data!.items] : r.data!.items
      );
      setThinOffset(r.data.offset);
      setThinHasMore(r.data.hasMore);
      setThinState("saved");
    });
  }

  function runSchemaValidate() {
    setSchemaState("saving");
    setSchemaError("");
    startTransition(async () => {
      const r = await validateSchemaUrlAction(schemaUrl);
      if (!r.success || !r.data) {
        setSchemaState("error");
        setSchemaError(r.success ? "Няма резултат" : r.error);
        setSchemaResult(r.data ?? null);
        return;
      }
      setSchemaResult(r.data);
      setSchemaState("saved");
    });
  }

  function runSchemaSample() {
    setSchemaState("saving");
    setSchemaError("");
    startTransition(async () => {
      const r = await validateSchemaSampleAction(sampleType);
      if (!r.success || !r.data) {
        setSchemaState("error");
        setSchemaError(r.success ? "Няма резултат" : r.error);
        return;
      }
      setSchemaResult(r.data);
      setSchemaState("saved");
    });
  }

  return (
    <div className="space-y-8">
      {/* Batch internal linking */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <Link2 className="h-4.5 w-4.5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Internal linking batch
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Сканира destinations на парчета, загрява hub index и брои
              възможности за auto-links. Самите линкове се прилагат при render
              (max 4/страница).
            </p>
          </div>
        </div>

        <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <dt className="text-[11px] text-gray-500">Status</dt>
            <dd className="font-semibold text-gray-900">{batch.status}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <dt className="text-[11px] text-gray-500">Destinations</dt>
            <dd className="font-semibold text-gray-900">
              {batch.processedDestinations}
              {batch.totalDestinationsEstimate
                ? ` / ~${batch.totalDestinationsEstimate}`
                : ""}
            </dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <dt className="text-[11px] text-gray-500">Places scanned</dt>
            <dd className="font-semibold text-gray-900">
              {batch.processedPlaces}
            </dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <dt className="text-[11px] text-gray-500">Link opportunities</dt>
            <dd className="font-semibold text-gray-900">{batch.linksFound}</dd>
          </div>
        </dl>

        {batch.lastMessage ? (
          <p className="mb-3 text-xs text-gray-600">{batch.lastMessage}</p>
        ) : null}
        {batch.lastError ? (
          <p className="mb-3 text-xs text-red-600">{batch.lastError}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => runChunk(batch.status === "idle")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {batch.status === "running" ? "Next chunk" : "Run chunk"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runChunk(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset & run
          </button>
          <Feedback state={batchState} error={batchError} />
        </div>
      </section>

      {/* Thin content */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
            <Search className="h-4.5 w-4.5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Thin content
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Places с &lt;100 думи (description + wiki) — noindex / извън
              sitemap. Обогати или изтрий.
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => loadThin(0, false)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            Load thin places
          </button>
          {thinHasMore ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => loadThin(thinOffset, true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Load more
            </button>
          ) : null}
          <Feedback state={thinState} error={thinError} />
        </div>

        {thinItems.length > 0 ? (
          <div className="max-h-80 overflow-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Place</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Path</th>
                </tr>
              </thead>
              <tbody>
                {thinItems.map((row) => (
                  <tr key={row.placeId} className="border-t border-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {row.placeName}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {row.city}, {row.country}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={row.path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 hover:underline"
                      >
                        {row.path}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Все още няма заредени резултати.
          </p>
        )}
      </section>

      {/* JSON-LD tester */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
            <FileJson className="h-4.5 w-4.5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              JSON-LD tester
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Валидирай generateSchema за URL или sample page type (като
              validate:schema).
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={schemaUrl}
            onChange={(e) => setSchemaUrl(e.target.value)}
            placeholder="/en/explore/france/paris или пълен URL"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={runSchemaValidate}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            Validate URL
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={sampleType}
            onChange={(e) => setSampleType(e.target.value as SchemaPageType)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
          >
            {SAMPLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isPending}
            onClick={runSchemaSample}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Validate sample
          </button>
          <Feedback
            state={schemaState}
            error={schemaError}
            message={
              schemaResult
                ? schemaResult.ok
                  ? "OK"
                  : "Warnings"
                : undefined
            }
          />
        </div>

        {schemaResult ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Type: <strong>{schemaResult.pageType}</strong>
              {schemaResult.canonicalUrl
                ? ` · ${schemaResult.canonicalUrl}`
                : ""}
            </p>
            <ul className="space-y-1">
              {schemaResult.checks.map((c) => (
                <li
                  key={c.message}
                  className={`text-xs ${c.ok ? "text-emerald-700" : "text-red-600"}`}
                >
                  {c.ok ? "✓" : "✗"} {c.message}
                </li>
              ))}
            </ul>
            {schemaResult.jsonLd ? (
              <pre className="max-h-72 overflow-auto rounded-xl bg-gray-950 p-3 text-[11px] leading-relaxed text-emerald-100">
                {JSON.stringify(schemaResult.jsonLd, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
