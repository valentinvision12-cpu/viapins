"use client";

import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, Loader2, Check } from "lucide-react";
import { updatePassportIdentityAction } from "@/actions/update-profile";
import {
  PASSPORT_INTERESTS,
  PASSPORT_LANGUAGES,
  normalizeUsername,
} from "@/lib/passport-identity";
import { PASSPORT } from "@/lib/luxury-palette";

export type IdentityEditorValues = {
  full_name: string;
  username: string;
  bio: string;
  home_country: string;
  interests: string[];
  languages: string[];
  cover_url: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  initial: IdentityEditorValues;
}

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: "0.75rem",
  border: `1px solid ${PASSPORT.cardBorder}`,
  background: PASSPORT.bg,
  padding: "0.65rem 0.85rem",
  fontSize: "0.875rem",
  color: PASSPORT.text,
  outline: "none",
};

export function PassportIdentityEditor({ open, onClose, initial }: Props) {
  const t = useTranslations("myTrip");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState(initial);

  if (!open) return null;

  function toggleInterest(key: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(key)
        ? f.interests.filter((i) => i !== key)
        : [...f.interests, key].slice(0, 9),
    }));
  }

  function toggleLanguage(lang: string) {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang].slice(0, 8),
    }));
  }

  function handleSave() {
    setError("");
    setOk(false);
    startTransition(async () => {
      const result = await updatePassportIdentityAction({
        full_name: form.full_name,
        username: normalizeUsername(form.username),
        bio: form.bio,
        home_country: form.home_country,
        interests: form.interests,
        languages: form.languages,
        cover_url: form.cover_url,
      });
      if (!result.success) {
        setError(result.error ?? t("passportIdentitySaveError"));
        return;
      }
      setOk(true);
      router.refresh();
      setTimeout(onClose, 500);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#1C1409]/35 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border p-5 shadow-2xl sm:p-6"
        style={{
          background: PASSPORT.card,
          borderColor: PASSPORT.cardBorder,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: PASSPORT.text }}>
            {t("passportIdentityEdit")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-black/[0.04]"
            aria-label="Close"
          >
            <X className="h-4 w-4" style={{ color: PASSPORT.textMuted }} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label={t("passportFieldName")}>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              style={inputStyle}
              maxLength={80}
            />
          </Field>
          <Field label={t("passportFieldUsername")}>
            <div className="flex items-center gap-1">
              <span style={{ color: PASSPORT.textMuted }}>@</span>
              <input
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: normalizeUsername(e.target.value) })
                }
                style={inputStyle}
                maxLength={24}
                placeholder="traveler"
              />
            </div>
          </Field>
          <Field label={t("passportFieldBio")}>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              style={{ ...inputStyle, minHeight: 88, resize: "none" }}
              maxLength={280}
              placeholder={t("passportBioPlaceholder")}
            />
          </Field>
          <Field label={t("passportFieldCountry")}>
            <input
              value={form.home_country}
              onChange={(e) => setForm({ ...form, home_country: e.target.value })}
              style={inputStyle}
              maxLength={80}
              placeholder="Bulgaria"
            />
          </Field>
          <Field label={t("passportFieldCover")}>
            <input
              value={form.cover_url}
              onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              style={inputStyle}
              placeholder="https://…"
            />
          </Field>

          <div>
            <p
              className="mb-2 text-xs font-semibold"
              style={{ color: PASSPORT.textSecondary }}
            >
              {t("passportFieldInterests")}
            </p>
            <div className="flex flex-wrap gap-2">
              {PASSPORT_INTERESTS.map((key) => {
                const active = form.interests.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleInterest(key)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold capitalize"
                    style={
                      active
                        ? { background: PASSPORT.accent, color: "#fff" }
                        : {
                            background: PASSPORT.accentSoft,
                            color: PASSPORT.textSecondary,
                            border: `1px solid ${PASSPORT.cardBorder}`,
                          }
                    }
                  >
                    {t(`passportInterest_${key}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p
              className="mb-2 text-xs font-semibold"
              style={{ color: PASSPORT.textSecondary }}
            >
              {t("passportFieldLanguages")}
            </p>
            <div className="flex flex-wrap gap-2">
              {PASSPORT_LANGUAGES.map((lang) => {
                const active = form.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={
                      active
                        ? { background: PASSPORT.accent, color: "#fff" }
                        : {
                            background: PASSPORT.card,
                            color: PASSPORT.textSecondary,
                            border: `1px solid ${PASSPORT.cardBorder}`,
                          }
                    }
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-xs text-red-500" role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            {t("passportIdentitySaved")}
          </p>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: PASSPORT.accent }}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("passportIdentitySave")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-xs font-semibold"
        style={{ color: PASSPORT.textSecondary }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
