"use client";

import { useEffect } from "react";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";

/**
 * Source-exact JS width breakpoints (09 §11, 14 §14): 1080/1120/1200/1250/1330.
 * rAF-throttled resize updates the store's vw; selectors below expose the same
 * progressive-hide flags the original used. Direction-agnostic values.
 */
export function useViewportTracker() {
  const api = useAppStoreApi();
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => api.getState().setVw(window.innerWidth));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [api]);
}

export function useChrome() {
  const vw = useAppStore((s) => s.vw);
  return {
    vw,
    showChange: vw >= 1330,
    showModuleKicker: vw >= 1250,
    showContextKicker: vw >= 1200,
    showUserText: vw >= 1120,
    showToolJumps: vw >= 1080,
  };
}
