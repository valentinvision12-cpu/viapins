import { createClient } from "@/lib/supabase/server";
import {
  Globe2,
  Map,
  Users,
  Route,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site-brand";

export const metadata = { title: "Начало" };

async function getStats() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return { destinations: null, places: null, users: null, routes: null };
  }

  const supabase = await createClient();
  const [destinations, places, users, routes] = await Promise.all([
    supabase.from("destinations").select("id", { count: "exact", head: true }),
    supabase.from("places").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_routes").select("id", { count: "exact", head: true }),
  ]);

  return {
    destinations: destinations.count ?? 0,
    places: places.count ?? 0,
    users: users.count ?? 0,
    routes: routes.count ?? 0,
  };
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm transition-all ${href ? "hover:shadow-md hover:border-gray-200 cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">
        {value === null ? (
          <span className="text-gray-300 text-lg">—</span>
        ) : (
          value.toLocaleString("bg-BG")
        )}
      </p>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Module card ───────────────────────────────────────────────────────────────
function ModuleCard({
  number,
  title,
  description,
  status,
  href,
}: {
  number: number;
  title: string;
  description: string;
  status: "active" | "pending";
  href?: string;
}) {
  const inner = (
    <div
      className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all ${
        status === "active"
          ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300"
          : "border-gray-100 bg-white opacity-55 cursor-not-allowed"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          status === "active"
            ? "bg-emerald-500 text-white"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {status === "active" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Модул {number}
          </span>
          {status === "active" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">
              Активен
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      {status === "active" && href && (
        <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
      )}
    </div>
  );

  return status === "active" && href ? (
    <Link href={href}>{inner}</Link>
  ) : (
    inner
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Добре дошли 👋
        </h1>
        <p className="text-gray-500 text-sm">
          Контролен панел на {SITE_NAME}
        </p>
      </div>

      {/* Workflow */}
      <div className="mb-8 p-6 rounded-2xl border border-emerald-200 bg-emerald-50/80">
        <h2 className="text-sm font-bold text-emerald-800 mb-3">Как работи (без AI ключ)</h2>
        <ol className="text-sm text-emerald-900/80 space-y-2 mb-4 list-decimal list-inside">
          <li>
            Казваш на Cursor agent: <em>„Качи Greece“</em> или{" "}
            <em>„Направи seed за Croatia“</em>
          </li>
          <li>
            Agent генерира файла и го качва на сайта автоматично
          </li>
          <li>
            <Link href="/admin/destinations" className="underline font-medium">
              Дестинации
            </Link>{" "}
            — ти управляваш: публикувай / скрий / замени / изтрий
          </li>
        </ol>
        <p className="text-xs text-emerald-700/70">
          Ръчен import (ако искаш):{" "}
          <Link href="/admin/import" className="underline">
            Качи държава
          </Link>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Дестинации"
          value={stats.destinations}
          icon={Map}
          color="bg-blue-50 text-blue-500"
        />
        <StatCard
          label="Забележителности"
          value={stats.places}
          icon={Globe2}
          color="bg-amber-50 text-amber-500"
        />
        <StatCard
          label="Потребители"
          value={stats.users}
          icon={Users}
          color="bg-purple-50 text-purple-500"
          href="/admin/users"
        />
        <StatCard
          label="Маршрути"
          value={stats.routes}
          icon={Route}
          color="bg-green-50 text-green-500"
        />
      </div>

      {/* AI Generator teaser (Module 2) */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-[oklch(0.22_0.07_250)] to-[oklch(0.28_0.10_265)] text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-[oklch(0.72_0.13_82)]" />
          <span className="text-sm font-semibold">
            AI Генератор на Дестинации
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            Модул 2
          </span>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          Въведете град и страна → Claude AI генерира Топ 10 забележителности с
          описания на 5 езика, снимки от Wikimedia Commons и GPS координати. Готово
          за 5 секунди.
        </p>
      </div>

      {/* Roadmap */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Пътна карта на проекта
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ModuleCard
            number={1}
            title="The Fortress & i18n Matrix"
            description="Next.js 15, Supabase SSR, next-intl (5 езика), Rate-limited Translation API"
            status="active"
          />
          <ModuleCard
            number={2}
            title="God Mode Admin Panel"
            description="Български UI, Claude AI генератор, Wikimedia + Wikipedia интеграция"
            status="active"
            href="/admin/ai-generator"
          />
          <ModuleCard
            number={3}
            title="Public Face & Smart Language Engine"
            description="Hero секция, Destinations Grid, Динамичен превключвател на езика"
            status="active"
            href="/en"
          />
          <ModuleCard
            number={4}
            title="City & Landmarks Experience"
            description="Забележителности, Wikipedia акордеон, Route cart механика"
            status="active"
            href="/en/explore/france/paris"
          />
          <ModuleCard
            number={5}
            title="Frictionless Auth Funnel"
            description="Magic Link + Google OAuth, My Passport, Споделяне на маршрути"
            status="active"
            href="/en/my-passport"
          />
          <ModuleCard
            number={6}
            title="Gamification & Viral Engine"
            description="dnd-kit реред, gold stamp, embed widget, discovery loop, social proof"
            status="active"
            href="/en/explore/france/paris"
          />
          <ModuleCard
            number={7}
            title="Monetisation & Schema.org SEO"
            description="4 рекламни позиции, JSON-LD Rich Snippets, Sitemap, /terms, /privacy"
            status="active"
            href="/admin/monetization"
          />
        </div>
      </div>
    </div>
  );
}
