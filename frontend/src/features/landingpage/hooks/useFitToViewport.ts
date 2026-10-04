import { useLayoutEffect, useRef, useState } from "react";

/*
|--------------------------------------------------------------------------
| Viewport fit hook
|--------------------------------------------------------------------------
| Full-page fit: measures a section against its content and returns a
| scale ≤ 1 so the content always fits one screen on md+. Pure measurement
| (ResizeObserver + window resize, rAF-debounced) — no scroll listeners, so
| scrolling stays CSS-native and cheap.
*/

/** Tailwind `md` breakpoint — keep in sync with the md:* snap classes. */
const FIT_BREAKPOINT = 768;
/** Breathing room (px) kept above/below a fitted section. */
const FIT_MARGIN = 24;

export function useFitToViewport() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;
    if (typeof ResizeObserver === "undefined") return;

    let raf = 0;
    const compute = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        if (window.innerWidth < FIT_BREAKPOINT) {
          setScale(1);
          return;
        }
        const natural = content.offsetHeight;
        const height = section.offsetHeight;
        // Only shrink content that actually exceeds the section (keeps
        // content-sized sections at scale 1 — no phantom down-scaling).
        const next = natural <= height ? 1 : Math.min(1, (height - FIT_MARGIN) / natural);
        // Skip sub-1% jitter so tiny reflows don't re-render.
        setScale((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
      });
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(content);
    window.addEventListener("resize", compute);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  return { sectionRef, contentRef, scale };
}
