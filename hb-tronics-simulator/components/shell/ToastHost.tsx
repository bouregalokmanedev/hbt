"use client";

import { useEffect } from "react";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";

/** Toast host (09 §8.9). Single message, auto-dismiss 2.4s; aria-live polite (10 §17). */
export function ToastHost() {
  const toast = useAppStore((s) => s.toast);
  const api = useAppStoreApi();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => api.getState().clearToast(), 2400);
    return () => clearTimeout(id);
  }, [toast, api]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
      {toast ? (
        <div className="pointer-events-auto rounded-lg bg-shell-card px-4 py-2.5 t-cta text-shell-textHi shadow-modal">
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
