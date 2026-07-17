"use client";

import { useState } from "react";
import { BookMarked, Check, AlertTriangle } from "lucide-react";
import { useRouteCart, type RouteCartItem } from "@/lib/context/route-cart-context";
import { validateSingleCityRoute } from "@/lib/route-scope";
import { AuthModal } from "@/components/public/auth-modal";

interface PlacePreview {
  id: string;
  name: string;
  city: string;
  country: string;
  image_url: string;
  lat: number;
  lng: number;
}

interface Props {
  places: PlacePreview[];
  locale: string;
}

export function SharedRouteActions({ places }: Props) {
  const { addItem } = useRouteCart();
  const [cloned, setCloned] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cloneError, setCloneError] = useState("");

  const cartItems: RouteCartItem[] = places.map((p, i) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    country: p.country,
    lat: p.lat,
    lng: p.lng,
    image_url: p.image_url,
    order_index: i,
    mode: "city",
  }));

  function handleClone() {
    const scopeError = validateSingleCityRoute(cartItems);
    if (scopeError) {
      setCloneError(scopeError);
      setTimeout(() => setCloneError(""), 4000);
      return;
    }
    let allAdded = true;
    for (const item of cartItems) {
      if (!addItem(item)) allAdded = false;
    }
    if (allAdded) setCloned(true);
  }

  return (
    <>
      {cloneError && (
        <p className="text-amber-300 text-xs text-center mb-2 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          {cloneError}
        </p>
      )}
      <button
        onClick={handleClone}
        disabled={cloned}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl border border-white/12 text-white/70 hover:text-white hover:border-white/25 font-medium transition-all disabled:opacity-60"
      >
        {cloned ? (
          <><Check className="w-4.5 h-4.5 text-emerald-400" /> Added to your route cart!</>
        ) : (
          <><BookMarked className="w-4.5 h-4.5" /> Clone this route to my cart</>
        )}
      </button>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        pendingItems={cartItems}
        routeTitle={`Cloned: ${places[0]?.city ?? "Route"}`}
        onAuthSuccess={() => setAuthOpen(false)}
      />
    </>
  );
}
