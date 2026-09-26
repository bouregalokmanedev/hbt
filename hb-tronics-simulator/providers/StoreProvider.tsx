"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { createAppStore, type AppStore, type AppState } from "@/stores/createStore";

/** SSR-safe store context — one instance per client (review F2, 10 §6). */
const StoreContext = createContext<AppStore | null>(null);

export function StoreProvider({ children, language }: { children: ReactNode; language?: "en" | "ar" | "fr" }) {
  const ref = useRef<AppStore>(undefined);
  if (!ref.current) {
    ref.current = createAppStore();
    if (language) ref.current.getState().setSetting("language", language);
  }
  return <StoreContext.Provider value={ref.current}>{children}</StoreContext.Provider>;
}

export function useAppStore<T>(selector: (s: AppState) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useAppStore must be used within StoreProvider");
  return useStore(store, selector);
}

export function useAppStoreApi(): AppStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useAppStoreApi must be used within StoreProvider");
  return store;
}
