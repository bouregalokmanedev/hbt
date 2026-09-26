"use client";

import { useEffect, useState } from "react";

/**
 * Tracks prefers-reduced-motion (10 §17). Used to pause continuous engine
 * animation loops (scope redraw, live-data stream) so motion is opt-in for users
 * who request reduced motion — without breaking required feedback.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
