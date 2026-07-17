"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  canAddToCart,
  getCartScope,
  type RouteScope,
  type BlockReason,
} from "@/lib/route-scope";

export type RouteMode = "city" | "adventure";

export interface RouteCartItem {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  image_url: string;
  order_index: number;
  mode?: RouteMode;
  region?: string;
  requires_car?: boolean;
  day?: number;
}

export interface RouteBlockNotice {
  reason: BlockReason;
  attemptedMode: RouteMode;
  attemptedCity: string;
  attemptedCountry: string;
  currentMode: RouteMode;
  currentCity: string;
  currentCountry: string;
  pendingItem: RouteCartItem;
}

interface RouteCartContextType {
  items: RouteCartItem[];
  scope: RouteScope | null;
  cartMode: RouteMode | null;
  addItem: (item: RouteCartItem) => boolean;
  addManyItems: (items: RouteCartItem[]) => boolean;
  removeItem: (id: string) => void;
  clearCart: () => void;
  replaceCart: (items: RouteCartItem[]) => void;
  isInCart: (id: string) => boolean;
  totalItems: number;
  blockNotice: RouteBlockNotice | null;
  dismissBlock: () => void;
  startNewRouteForBlocked: () => void;
}

const RouteCartContext = createContext<RouteCartContextType | null>(null);

const STORAGE_KEY = "ltm_route_cart";

export function RouteCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RouteCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [blockNotice, setBlockNotice] = useState<RouteBlockNotice | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: RouteCartItem): boolean => {
    if (items.some((i) => i.id === item.id)) return true;

    const check = canAddToCart(items, item);
    if (!check.ok) {
      const current = getCartScope(items)!;
      const attemptedMode = item.mode ?? "city";
      setBlockNotice({
        reason: check.reason,
        attemptedMode,
        attemptedCity: item.region ?? item.city,
        attemptedCountry: item.country,
        currentMode: current.mode,
        currentCity: current.mode === "city" ? current.city : current.country,
        currentCountry: current.country,
        pendingItem: item,
      });
      return false;
    }

    setBlockNotice(null);
    setItems((prev) => {
      const next = [...prev, item];
      if ((item.mode ?? "city") === "adventure") {
        return next.sort((a, b) => a.order_index - b.order_index);
      }
      return next;
    });
    return true;
  }, [items]);

  const addManyItems = useCallback((newItems: RouteCartItem[]): boolean => {
    if (newItems.length === 0) return true;

    let simulated = [...items];
    const toAdd: RouteCartItem[] = [];

    for (const item of newItems) {
      if (simulated.some((i) => i.id === item.id)) continue;
      const check = canAddToCart(simulated, item);
      if (!check.ok) {
        const current = getCartScope(items)!;
        const attemptedMode = item.mode ?? "city";
        setBlockNotice({
          reason: check.reason,
          attemptedMode,
          attemptedCity: item.region ?? item.city,
          attemptedCountry: item.country,
          currentMode: current.mode,
          currentCity: current.mode === "city" ? current.city : current.country,
          currentCountry: current.country,
          pendingItem: item,
        });
        return false;
      }
      simulated.push(item);
      toAdd.push(item);
    }

    if (toAdd.length === 0) return true;

    setBlockNotice(null);
    setItems((prev) => {
      const next = [...prev, ...toAdd];
      if ((toAdd[0].mode ?? "city") === "adventure") {
        return next.sort((a, b) => a.order_index - b.order_index);
      }
      return next;
    });
    return true;
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setBlockNotice(null);
  }, []);

  const replaceCart = useCallback((newItems: RouteCartItem[]) => {
    setBlockNotice(null);
    const sorted =
      newItems.length > 0 && (newItems[0].mode ?? "city") === "adventure"
        ? [...newItems].sort((a, b) => a.order_index - b.order_index)
        : newItems;
    setItems(sorted);
  }, []);

  const dismissBlock = useCallback(() => setBlockNotice(null), []);

  const startNewRouteForBlocked = useCallback(() => {
    setBlockNotice((notice) => {
      if (!notice) return null;
      setItems([notice.pendingItem]);
      return null;
    });
  }, []);

  const isInCart = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const scope = getCartScope(items);
  const cartMode = scope?.mode ?? null;

  return (
    <RouteCartContext.Provider
      value={{
        items,
        scope,
        cartMode,
        addItem,
        addManyItems,
        removeItem,
        clearCart,
        replaceCart,
        isInCart,
        totalItems: items.length,
        blockNotice,
        dismissBlock,
        startNewRouteForBlocked,
      }}
    >
      {children}
    </RouteCartContext.Provider>
  );
}

export function useRouteCart() {
  const ctx = useContext(RouteCartContext);
  if (!ctx) throw new Error("useRouteCart must be inside RouteCartProvider");
  return ctx;
}
