"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Radar,
  KeyRound,
  FileJson,
  Send,
  Globe2,
  RefreshCw,
} from "lucide-react";
import {
  generateIndexNowKeyAction,
  saveGoogleIndexingCredentialsAction,
  saveIndexNowKeyAction,
  saveIndexingPrefsAction,
  submitEntireSiteAction,
  submitUrlsAction,
  type ActionResult,
} from "@/actions/indexing";
import type {
  IndexingPrefs,
  IndexingRunEntry,
  IndexingStatusSnapshot,
} from "@/lib/search-engines/types";

type AdminState = IndexingStatusSnapshot & { prefs: IndexingPrefs };

type Props = {
  initialState: AdminState;
};

function StatusBadge({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        ok
          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
          : "bg-amber-50 text-amber-700 border border-amber-100"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {label}
    </span>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-sky-600"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function Feedback({
  state,
  error,
}: {
  state: "idle" | "saving" | "saved" | "error";
  error: string;
}) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Запис…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5" /> Готово
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
        <AlertCircle className="w-3.5 h-3.5" /> {error || "Грешка"}
      </span>
    );
  }
  return null;
}

export function IndexingPanel({ initialState }: Props) {
  const [state, setState] = useState(initialState);
  const [prefs, setPrefs] = useState<IndexingPrefs>(initialState.prefs);
  const [indexNowKey, setIndexNowKey] = useState("");
  const [googleJson, setGoogleJson] = useState("");
  const [manualUrls, setManualUrls] = useState("");

  const [prefsState, setPrefsState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [prefsError, setPrefsError] = useState("");
  const [keyState, setKeyState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [keyError, setKeyError] = useState("");
  const [googleState, setGoogleState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [googleError, setGoogleError] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [isPending, startTransition] = useTransition();

  function applyResult(r: ActionResult, onOk?: (r: ActionResult) => void) {
    if (r.success) {
      onOk?.(r);
      return true;
    }
    return false;
  }

  function refreshFromResult(r: ActionResult) {
    if (r.success && r.result) {
      const entry: IndexingRunEntry = {
        at: new Date().toISOString(),
        source: "admin",
        urlCount: r.result.urlCount,
        type: r.result.type,
        channels: {
          ...(r.result.indexnow ? { indexnow: r.result.indexnow } : {}),
          ...(r.result.google ? { google: r.result.google } : {}),
          ...(r.result.sitemapPing
            ? { sitemap_ping: r.result.sitemapPing }
            : {}),
        },
      };
      setState((prev) => ({
        ...prev,
        lastRuns: [entry, ...prev.lastRuns].slice(0, 25),
        indexNowConfigured: prev.indexNowConfigured,
        googleConfigured: prev.googleConfigured,
      }));
    }
  }

  function handleSavePrefs() {
    setPrefsState("saving");
    setPrefsError("");
    startTransition(async () => {
      const r = await saveIndexingPrefsAction(prefs);
      if (applyResult(r)) {
        setPrefsState("saved");
        setState((p) => ({ ...p, prefs }));
        setTimeout(() => setPrefsState("idle"), 2500);
      } else {
        setPrefsState("error");
        setPrefsError(!r.success ? r.error : "Грешка");
      }
    });
  }

  function handleSaveIndexNow(generate: boolean) {
    setKeyState("saving");
    setKeyError("");
    startTransition(async () => {
      const r = generate
        ? await generateIndexNowKeyAction()
        : await saveIndexNowKeyAction({ key: indexNowKey });
      if (r.success) {
        setKeyState("saved");
        if (r.key) setIndexNowKey(r.key);
        setState((p) => ({ ...p, indexNowConfigured: true }));
        setTimeout(() => setKeyState("idle"), 4000);
      } else {
        setKeyState("error");
        setKeyError(r.error);
      }
    });
  }

  function handleSaveGoogle() {
    setGoogleState("saving");
    setGoogleError("");
    startTransition(async () => {
      const r = await saveGoogleIndexingCredentialsAction({
        serviceAccountJson: googleJson,
      });
      if (r.success) {
        setGoogleState("saved");
        setState((p) => ({ ...p, googleConfigured: true }));
        setGoogleJson("");
        setTimeout(() => setGoogleState("idle"), 4000);
      } else {
        setGoogleState("error");
        setGoogleError(r.error);
      }
    });
  }

  function handleEntireSite() {
    setSubmitState("saving");
    setSubmitError("");
    setSubmitMsg("");
    startTransition(async () => {
      const r = await submitEntireSiteAction();
      if (r.success) {
        setSubmitState("saved");
        setSubmitMsg(r.message ?? "Готово");
        refreshFromResult(r);
        setTimeout(() => setSubmitState("idle"), 5000);
      } else {
        setSubmitState("error");
        setSubmitError(r.error);
      }
    });
  }

  function handleManualSubmit() {
    const urls = manualUrls
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    setSubmitState("saving");
    setSubmitError("");
    setSubmitMsg("");
    startTransition(async () => {
      const r = await submitUrlsAction(urls);
      if (r.success) {
        setSubmitState("saved");
        setSubmitMsg(r.message ?? "Готово");
        refreshFromResult(r);
        setTimeout(() => setSubmitState("idle"), 4000);
      } else {
        setSubmitState("error");
        setSubmitError(r.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Status */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-bold text-gray-700">Статус</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <StatusBadge
            ok={state.indexNowConfigured}
            label={
              state.indexNowConfigured
                ? "IndexNow конфигуриран"
                : "IndexNow липсва"
            }
          />
          <StatusBadge
            ok={state.googleConfigured}
            label={
              state.googleConfigured
                ? "Google Indexing OK"
                : "Google не е настроен"
            }
          />
          <StatusBadge ok={Boolean(state.siteUrl)} label={state.siteUrl} />
        </div>
        <p className="text-xs text-gray-500">
          Приблизително{" "}
          <span className="font-semibold text-gray-700">
            {state.estimatedUrlCount.toLocaleString("bg-BG")}
          </span>{" "}
          публични URL-а (всички локали).
        </p>
      </section>

      {/* Prefs */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-700">Автоматични сигнали</h2>
          <Feedback state={prefsState} error={prefsError} />
        </div>
        <ToggleRow
          label="Автоматично уведомяване"
          description="При publish / import / toggle — fire-and-forget към търсачките"
          checked={prefs.auto_notify}
          onChange={(v) => setPrefs((p) => ({ ...p, auto_notify: v }))}
          disabled={isPending}
        />
        <ToggleRow
          label="IndexNow"
          description="Bing, Yandex, Naver, Seznam — бърз submit на URL списък"
          checked={prefs.indexnow}
          onChange={(v) => setPrefs((p) => ({ ...p, indexnow: v }))}
          disabled={isPending}
        />
        <ToggleRow
          label="Google Indexing API"
          description="Директен push към Google (~200 URL/ден квота)"
          checked={prefs.google}
          onChange={(v) => setPrefs((p) => ({ ...p, google: v }))}
          disabled={isPending}
        />
        <ToggleRow
          label="Sitemap ping"
          description="Пинг към Google/Bing че sitemap.xml е обновен"
          checked={prefs.sitemap_ping}
          onChange={(v) => setPrefs((p) => ({ ...p, sitemap_ping: v }))}
          disabled={isPending}
        />
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSavePrefs}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            Запази настройките
          </button>
        </div>
      </section>

      {/* IndexNow key */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-700">IndexNow ключ</h2>
          </div>
          <Feedback state={keyState} error={keyError} />
        </div>
        <input
          type="text"
          value={indexNowKey}
          onChange={(e) => setIndexNowKey(e.target.value)}
          placeholder="UUID или съществуващ ключ"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono mb-3"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSaveIndexNow(false)}
            disabled={isPending || !indexNowKey.trim()}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Запази ключ
          </button>
          <button
            type="button"
            onClick={() => handleSaveIndexNow(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Генерирай нов
          </button>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-4">
          След запис на ключ в .env.local рестартирай dev/prod сървъра, за да се
          зареди. Публичният файл: /indexnow-key.txt
        </p>
      </section>

      {/* Google SA */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-700">
              Google service account JSON
            </h2>
          </div>
          <Feedback state={googleState} error={googleError} />
        </div>
        <textarea
          value={googleJson}
          onChange={(e) => setGoogleJson(e.target.value)}
          rows={6}
          placeholder='{"type":"service_account","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n..."}'
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-mono mb-3"
        />
        <button
          type="button"
          onClick={handleSaveGoogle}
          disabled={isPending || !googleJson.trim()}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          Запази Google credentials
        </button>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-4">
          След запис рестартирай сървъра. Добави service account email като Owner
          на property-то в Google Search Console.
        </p>
      </section>

      {/* Actions */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-700">Ръчно индексиране</h2>
          </div>
          <Feedback
            state={submitState}
            error={submitError || submitMsg}
          />
        </div>

        <button
          type="button"
          onClick={handleEntireSite}
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 shadow-sm mb-3"
        >
          <Send className="w-4 h-4" />
          Индексирай целия сайт
        </button>

        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          Google Indexing API има ~200 URL/ден квота. При пълен сайт: IndexNow
          за всички URL-и + sitemap ping + ограничен брой към Google.
        </p>

        <label className="text-xs font-medium text-gray-600">
          Ръчни URL-и (по един на ред)
        </label>
        <textarea
          value={manualUrls}
          onChange={(e) => setManualUrls(e.target.value)}
          rows={5}
          placeholder="https://viapins.com/en/explore/..."
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-mono mt-1.5 mb-3"
        />
        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={isPending || !manualUrls.trim()}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Изпрати URL-ите
        </button>
      </section>

      {/* Log */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Последни пускания</h2>
        {state.lastRuns.length === 0 ? (
          <p className="text-sm text-gray-400">Все още няма записани пускания.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-medium">Време</th>
                  <th className="py-2 pr-3 font-medium">Източник</th>
                  <th className="py-2 pr-3 font-medium">URL</th>
                  <th className="py-2 pr-3 font-medium">Тип</th>
                  <th className="py-2 font-medium">Канали</th>
                </tr>
              </thead>
              <tbody>
                {state.lastRuns.map((run, i) => (
                  <tr key={`${run.at}-${i}`} className="border-b border-gray-50">
                    <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">
                      {new Date(run.at).toLocaleString("bg-BG")}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-gray-700">
                      {run.source}
                    </td>
                    <td className="py-2.5 pr-3">{run.urlCount}</td>
                    <td className="py-2.5 pr-3">{run.type}</td>
                    <td className="py-2.5 text-gray-600">
                      {Object.entries(run.channels)
                        .map(
                          ([k, v]) =>
                            `${k}:${v?.ok ? "ok" : "fail"}${
                              v?.submitted != null ? `(${v.submitted})` : ""
                            }`
                        )
                        .join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
