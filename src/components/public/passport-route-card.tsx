"use client";

import { useState, useTransition, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Stamp, Trash2,
  Check, Loader2, X, Code2, Copy, Map, ListOrdered, AlertTriangle,
  ChevronDown, Circle, Car, Compass, MapPin, Download,
} from "lucide-react";
import { markRouteVisitedAction, deleteRouteAction, togglePlaceVisitedAction } from "@/actions/save-route";
import { reorderRouteAction } from "@/actions/reorder-route";
import { mapsPinLinkProps } from "@/components/public/maps-place-link";
import {
  buildRouteGpxStops,
  cartMatchesSavedRoute,
  exportRouteGpxFromStops,
} from "@/lib/export-route-gpx";
import { useRouteCart } from "@/lib/context/route-cart-context";
import type { SavedRoute } from "@/actions/get-my-routes";
import { SITE_NAME, SITE_DEFAULT_URL } from "@/lib/site-brand";
import { fallbackImageUrl } from "@/lib/fallback-image";

function buildEmbedPayload(route: SavedRoute) {
  return {
    t: route.title,
    p: route.route_places.map((p) => ({
      n: p.name,
      c: p.city,
      r: p.country,
      i: p.image_url,
      a: p.lat,
      o: p.lng,
    })),
  };
}

// ── Stamp particles ───────────────────────────────────────────────────────────

const PARTICLE_ANGLES = Array.from({ length: 10 }, (_, i) => (360 / 10) * i);

function StampParticle({ angle, delay }: { angle: number; delay: number }) {
  const rad = (angle * Math.PI) / 180;
  const dist = 70;
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
      style={{ background: "oklch(0.72 0.13 82)" }}
      initial={{ x: -4, y: -4, scale: 0, opacity: 1 }}
      animate={{
        x: Math.cos(rad) * dist - 4,
        y: Math.sin(rad) * dist - 4,
        scale: [0, 1.6, 0],
        opacity: [1, 1, 0],
      }}
      transition={{ delay, duration: 0.65, ease: "easeOut" }}
    />
  );
}

// ── Sortable place item (inside editor modal) ─────────────────────────────────

interface RoutePlaceItem {
  place_id: string;
  name: string;
  city: string;
  image_url: string;
}

function SortablePlaceItem({ place, index }: { place: RoutePlaceItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: place.place_id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 50 : "auto",
      }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isDragging
          ? "bg-white/12 border-[oklch(0.72_0.13_82)]/40 shadow-xl"
          : "bg-white/4 border-white/8 hover:border-white/14"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Number */}
      <span className="w-5 text-right text-xs font-bold text-white/35 flex-shrink-0">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/8">
        <Image
          src={place.image_url || fallbackImageUrl(`${place.name}-${place.city}`, 144, 144)}
          alt={place.name}
          fill
          sizes="36px"
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Name */}
      <p className="flex-1 text-sm text-white truncate font-medium">{place.name}</p>
      <p className="text-xs text-white/30 flex-shrink-0">{place.city}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  route: SavedRoute;
}

export function PassportRouteCard({ route: initialRoute }: Props) {
  const router = useRouter();
  const t = useTranslations("route");
  const { items: cartItems, scope } = useRouteCart();
  const [isPending, startTransition] = useTransition();

  const sortedPlaces = [...initialRoute.route_places].sort((a, b) => a.order - b.order);
  const visitedCount = sortedPlaces.filter((p) => p.visited).length;
  const allVisited =
    sortedPlaces.length > 0 && visitedCount === sortedPlaces.length;

  // Stamp state
  const [showStamp, setShowStamp] = useState(false);
  const [stampDone, setStampDone] = useState(
    initialRoute.status === "visited" || allVisited
  );
  const [placeVisited, setPlaceVisited] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        sortedPlaces.map((p) => [p.place_id, !!p.visited])
      )
  );
  const [placesOpen, setPlacesOpen] = useState(false);
  const [togglingPlace, setTogglingPlace] = useState<string | null>(null);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [places, setPlaces] = useState<RoutePlaceItem[]>(
    [...initialRoute.route_places].sort((a, b) => a.order - b.order)
  );

  useEffect(() => {
    setPlaces([...initialRoute.route_places].sort((a, b) => a.order - b.order));
  }, [initialRoute.id, initialRoute.route_places]);

  const gpxStops = useMemo(
    () => buildRouteGpxStops(initialRoute, places, cartItems, scope),
    [initialRoute, places, cartItems, scope]
  );

  const cartExtraCount = useMemo(() => {
    if (!cartMatchesSavedRoute(scope, initialRoute)) return 0;
    const savedIds = new Set(places.map((p) => p.place_id));
    return cartItems.filter((i) => !savedIds.has(i.id)).length;
  }, [scope, initialRoute, places, cartItems]);
  const [saveOrderPending, setSaveOrderPending] = useState(false);
  const [saveOrderDone, setSaveOrderDone] = useState(false);

  // Embed state
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const thumbs = initialRoute.route_places.slice(0, 3).filter((p) => p.image_url);
  const isAdventure = initialRoute.route_type === "country";
  const cityLabel = isAdventure
    ? `${initialRoute.country ?? sortedPlaces[0]?.country ?? ""} Adventure`
    : initialRoute.city ??
      sortedPlaces[0]?.city ??
      [...new Set(initialRoute.route_places.map((p) => p.city))].join(" → ");
  const countryLabel = isAdventure ? "" : initialRoute.country ?? sortedPlaces[0]?.country ?? "";
  const currentVisitedCount = Object.values(placeVisited).filter(Boolean).length;

  // ── dnd-kit sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlaces((items) => {
        const oldIndex = items.findIndex((i) => i.place_id === active.id);
        const newIndex = items.findIndex((i) => i.place_id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  async function handleSaveOrder() {
    setSaveOrderPending(true);
    const result = await reorderRouteAction(
      initialRoute.id,
      places.map((p) => p.place_id)
    );
    setSaveOrderPending(false);
    if (result.success) {
      setSaveOrderDone(true);
      setTimeout(() => {
        setEditorOpen(false);
        setSaveOrderDone(false);
        router.refresh();
      }, 900);
    }
  }

  // ── Gold stamp ──
  const handleMarkVisited = useCallback(() => {
    if (stampDone) return;
    setShowStamp(true);
    // Call server action while animation plays
    startTransition(async () => {
      await markRouteVisitedAction(initialRoute.id);
    });
    setTimeout(() => {
      setShowStamp(false);
      setStampDone(true);
      router.refresh();
    }, 1800);
  }, [stampDone, initialRoute.id, router]);

  async function handleTogglePlace(placeId: string) {
    const next = !placeVisited[placeId];
    setPlaceVisited((prev) => ({ ...prev, [placeId]: next }));
    setTogglingPlace(placeId);
    const result = await togglePlaceVisitedAction(initialRoute.id, placeId, next);
    setTogglingPlace(null);
    if (!result.success) {
      setPlaceVisited((prev) => ({ ...prev, [placeId]: !next }));
      return;
    }
    const updatedCount = Object.values({ ...placeVisited, [placeId]: next }).filter(Boolean).length;
    if (updatedCount === sortedPlaces.length) setStampDone(true);
    else setStampDone(false);
    router.refresh();
  }

  // ── Delete ──
  async function handleDelete() {
    startTransition(async () => {
      const r = await deleteRouteAction(initialRoute.id);
      if (r.success) {
        router.refresh();
      } else {
        setDeleteError(t("deleteError"));
        setDeleteConfirm(false);
        setTimeout(() => setDeleteError(""), 3000);
      }
    });
  }

  // ── Embed code ──
  function getEmbedCode() {
    const payload = buildEmbedPayload(initialRoute);
    const encoded = encodeURIComponent(JSON.stringify(payload));
    const base = typeof window !== "undefined" ? window.location.origin : SITE_DEFAULT_URL;
    const src = `${base}/embed/route?d=${encoded}`;
    return `<iframe\n  src="${src}"\n  width="360"\n  height="480"\n  style="border:none;border-radius:16px;"\n  loading="lazy"\n  title="${initialRoute.title}"\n></iframe>`;
  }

  function handleCopyEmbed() {
    navigator.clipboard.writeText(getEmbedCode()).then(() => {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2500);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── ROUTE CARD ───────────────────────────────────────────────── */}
      <div className="group relative bg-white border border-stone-100 hover:border-stone-200 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md">
        {/* Gold stamp overlay */}
        <AnimatePresence>
          {showStamp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { delay: 0.3, duration: 0.4 } }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.72)" }}
            >
              {/* Circular stamp */}
              <motion.div
                initial={{ scale: 3.5, opacity: 0, rotate: -40 }}
                animate={{ scale: 1, opacity: 0.95, rotate: -8 }}
                transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.05 }}
                className="relative flex flex-col items-center justify-center w-28 h-28 rounded-full border-[3px] border-dashed"
                style={{
                  background: "oklch(0.72 0.13 82)",
                  borderColor: "oklch(0.55 0.16 82)",
                  boxShadow: "0 0 40px oklch(0.72 0.13 82 / 0.6)",
                }}
              >
                <span
                  className="font-black text-[15px] tracking-[0.18em] uppercase"
                  style={{ color: "oklch(0.12 0.008 260)" }}
                >
                  VISITED
                </span>
                <span
                  className="text-[9px] tracking-[0.12em] mt-0.5 font-bold opacity-60"
                  style={{ color: "oklch(0.12 0.008 260)" }}
                >
                  ✓ CONFIRMED
                </span>
              </motion.div>

              {/* Particles */}
              {PARTICLE_ANGLES.map((angle, i) => (
                <StampParticle key={i} angle={angle} delay={0.25 + i * 0.025} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thumbnail strip */}
        {thumbs.length > 0 && (
          <div className="relative flex h-28 overflow-hidden">
            {thumbs.map((p, i) => (
              <div
                key={p.place_id}
                className="relative overflow-hidden transition-transform duration-500 group-hover:scale-105"
                style={{ flexBasis: `${100 / thumbs.length}%` }}
              >
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {i < thumbs.length - 1 && (
                  <div className="absolute right-0 inset-y-0 w-px bg-black/30" />
                )}
              </div>
            ))}
            {/* Visited badge */}
            {stampDone && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: "oklch(0.72 0.13 82)",
                  color: "oklch(0.12 0.008 260)",
                }}
              >
                <Check className="w-2.5 h-2.5" /> Visited
              </motion.div>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            {isAdventure && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                <Compass className="w-3 h-3" />
                ADVENTURE
              </span>
            )}
            {isAdventure && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-medium">
                <Car className="w-3 h-3" />
                Road trip
              </span>
            )}
          </div>
          <h3 className="text-stone-900 font-semibold text-base mb-0.5 truncate">{initialRoute.title}</h3>
          {cityLabel && (
            <p className="text-stone-400 text-xs mb-2 truncate">
              {cityLabel}{countryLabel ? `, ${countryLabel}` : ""}
            </p>
          )}

          {/* Visit progress */}
          {sortedPlaces.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
                <span>
                  {t("placesProgress", {
                    visited: currentVisitedCount,
                    total: sortedPlaces.length,
                  })}
                </span>
                <span>{Math.round((currentVisitedCount / sortedPlaces.length) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(currentVisitedCount / sortedPlaces.length) * 100}%`,
                    background: "oklch(0.68 0.16 82)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-stone-400 text-xs">{initialRoute.route_places.length} places</span>
            <span className="text-stone-200">·</span>
            <span className="text-stone-300 text-xs">
              {new Date(initialRoute.created_at).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {deleteError && (
            <p className="text-red-400 text-xs mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{deleteError}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setEditorOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-300 text-xs transition-all"
            >
              <ListOrdered className="w-3 h-3" />
              Edit Order
            </button>

            {/* Mark Visited */}
            {!stampDone && (
              <button
                onClick={handleMarkVisited}
                disabled={isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 hover:text-amber-600 hover:border-amber-200 text-xs transition-all disabled:opacity-40"
              >
                <Stamp className="w-3 h-3" />
                Visited
              </button>
            )}


            <button
              type="button"
              onClick={() => exportRouteGpxFromStops(gpxStops, initialRoute.title)}
              disabled={gpxStops.length === 0}
              title={
                cartExtraCount > 0
                  ? t("downloadRouteGpxWithExtras", { count: cartExtraCount })
                  : t("downloadRouteGpxHint")
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold transition-all disabled:opacity-40"
            >
              <Download className="w-3 h-3" />
              {t("downloadRouteGpx")}
            </button>

            <div className="flex-1" />

            {/* Delete */}
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-1.5 rounded-xl text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete route"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t("deleteConfirm")}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="p-1.5 rounded-xl text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Per-place checklist */}
          <button
            type="button"
            onClick={() => setPlacesOpen((o) => !o)}
            className="flex items-center gap-1.5 w-full mb-3 px-2.5 py-2 rounded-xl bg-stone-50 border border-stone-100 text-stone-500 hover:text-stone-700 text-xs transition-all"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${placesOpen ? "rotate-180" : ""}`}
            />
            {placesOpen ? t("hideChecklist") : t("markPlacesVisited")}
          </button>

          {placesOpen && (
            <ul className="space-y-1.5 mb-3 max-h-56 overflow-y-auto">
              {sortedPlaces.map((place, idx) => {
                const checked = !!placeVisited[place.place_id];
                const loading = togglingPlace === place.place_id;
                return (
                  <li key={place.place_id} className="flex items-center gap-1.5">
                    {/* Visited toggle button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlace(place.place_id)}
                      disabled={loading}
                      className={`flex items-center gap-2.5 flex-1 px-2.5 py-2 rounded-xl text-left text-xs transition-all border ${
                        checked
                          ? "bg-amber-50/80 border-amber-200/60 text-stone-700"
                          : "bg-white border-stone-100 text-stone-500 hover:border-stone-200"
                      }`}
                    >
                      {/* Order number */}
                      <span className="w-4 text-right text-[10px] font-bold text-stone-300 flex-shrink-0">
                        {idx + 1}
                      </span>

                      {/* Checkbox */}
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors ${
                          checked
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "border-stone-200 bg-white"
                        }`}
                      >
                        {loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : checked ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3 text-stone-200" />
                        )}
                      </span>

                      <span className={`truncate flex-1 ${checked ? "line-through opacity-70" : ""}`}>
                        {place.name}
                      </span>
                    </button>

                    {/* Open location in Maps */}
                    {(() => {
                      const pin = mapsPinLinkProps(
                        place.lat,
                        place.lng,
                        place.name,
                        place.city,
                        place.country
                      );
                      if (!pin) return null;
                      return (
                    <a
                      href={pin.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={pin.title}
                      className="p-1.5 rounded-xl border border-stone-100 bg-white text-stone-300 hover:text-orange-500 hover:border-orange-200 transition-colors flex-shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </a>
                      );
                    })()}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── EDITOR MODAL (dnd-kit) ────────────────────────────────────── */}
      <AnimatePresence>
        {editorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50"
              onClick={() => setEditorOpen(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[80vh] rounded-t-3xl border-t border-white/10 overflow-hidden"
              style={{ background: "oklch(0.13 0.06 252)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-[oklch(0.72_0.13_82)]" />
                  <span className="text-white font-semibold text-sm">{t("reorderTitle")}</span>
                </div>
                <button
                  onClick={() => setEditorOpen(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="px-5 py-2.5 text-white/35 text-xs flex-shrink-0">
                <GripVertical className="w-3 h-3 inline mr-1 opacity-60" />
                {t("reorderHint")}
              </p>

              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-0">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={places.map((p) => p.place_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {places.map((place, i) => (
                      <SortablePlaceItem key={place.place_id} place={place} index={i} />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              <div className="px-4 pb-8 pt-3 border-t border-white/8 flex-shrink-0">
                <button
                  onClick={handleSaveOrder}
                  disabled={saveOrderPending || saveOrderDone}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60"
                  style={{
                    background: "oklch(0.72 0.13 82)",
                    color: "oklch(0.12 0.008 260)",
                  }}
                >
                  {saveOrderPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveOrderDone ? (
                    <><Check className="w-4 h-4" /> {t("orderSaved")}</>
                  ) : (
                    <><Map className="w-4 h-4" /> {t("saveOrder")}</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── EMBED MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {embedOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50"
              onClick={() => setEmbedOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
              style={{ background: "oklch(0.13 0.06 252)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[oklch(0.72_0.13_82)]" />
                  <span className="text-white font-semibold text-sm">Embed Widget</span>
                </div>
                <button
                  onClick={() => setEmbedOpen(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-4">
                <p className="text-white/45 text-xs mb-3 leading-relaxed">
                  {t("embedDesc")}
                </p>

                {/* Code block */}
                <div className="relative bg-black/30 rounded-xl border border-white/8 p-4 font-mono text-xs text-white/55 leading-relaxed overflow-x-auto mb-4">
                  <pre className="whitespace-pre-wrap break-all">{getEmbedCode()}</pre>
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopyEmbed}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
                  style={{
                    background: embedCopied
                      ? "oklch(0.40 0.13 145)"
                      : "oklch(0.72 0.13 82)",
                    color: "oklch(0.12 0.008 260)",
                  }}
                >
                  {embedCopied ? (
                    <><Check className="w-4 h-4" /> {t("embedCopied")}</>
                  ) : (
                    <><Copy className="w-4 h-4" /> {t("copyEmbedCode")}</>
                  )}
                </button>

                {/* Preview note */}
                <div className="mt-3 px-3 py-2.5 rounded-xl bg-white/4 border border-white/6">
                  <p className="text-white/30 text-[11px] text-center">
                    {t("embedPreview", {
                      count: initialRoute.route_places.length,
                      maps: "Google Maps",
                      siteName: SITE_NAME,
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
