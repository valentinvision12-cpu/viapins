"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Loader2, Trash2, RefreshCw } from "lucide-react";
import { togglePublishedAction } from "@/actions/toggle-published";
import { deleteDestinationAction } from "@/actions/delete-destination";
import { deleteCountryAction } from "@/actions/delete-country";
import { replaceDestinationAction } from "@/actions/replace-destination";

interface DestinationsActionsProps {
  destinationId: string;
  published: boolean;
}

export function DestinationsActions({
  destinationId,
  published,
}: DestinationsActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => togglePublishedAction(destinationId, published));
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
        published
          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={published ? "Скрий от сайта" : "Публикувай на сайта"}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : published ? (
        <Eye className="w-3 h-3" />
      ) : (
        <EyeOff className="w-3 h-3" />
      )}
      {published ? "Публикувана" : "Скрита"}
    </button>
  );
}

// ── Delete button with confirmation ──────────────────────────────────────────
export function DeleteDestinationButton({ destinationId }: { destinationId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Сигурен ли си? Дестинацията и всички забележителности ще бъдат изтрити.")) return;
    startTransition(() => deleteDestinationAction(destinationId));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      title="Изтрий дестинацията"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}

export function ReplaceDestinationButton({
  city,
  country,
}: {
  city: string;
  country: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleReplace() {
    if (
      !confirm(
        `Замени „${city}"?\n\nAI ще генерира нов Топ 10 и ще замени текущите забележителности.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await replaceDestinationAction(city, country);
      if (!result.success) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleReplace}
      disabled={isPending}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-40"
      title="AI генерира нов Топ 10 за този град"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <RefreshCw className="w-3 h-3" />
      )}
      Замени
    </button>
  );
}

export function DeleteCountryButton({ country }: { country: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        `Изтрий цяла държава „${country}"?\n\nВсички градове, забележителности и adventure маршрут ще бъдат премахнати.`
      )
    ) {
      return;
    }
    startTransition(() => {
      void deleteCountryAction(country);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
      title="Изтрий цялата държава"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      Изтрий държава
    </button>
  );
}
