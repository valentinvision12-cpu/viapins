"use client";

import { createContext, useContext, type ReactNode } from "react";

interface AdBlockContextValue {
  adBlockDetected: boolean;
}

const AdBlockContext = createContext<AdBlockContextValue>({ adBlockDetected: false });

export function useAdBlock() {
  return useContext(AdBlockContext);
}

/** Ad-block detection disabled — browsing and auth stay frictionless. */
export function AdBlockProvider({ children }: { children: ReactNode }) {
  return (
    <AdBlockContext.Provider value={{ adBlockDetected: false }}>
      {children}
    </AdBlockContext.Provider>
  );
}
