"use client";

import { useRef, useState } from "react";

/**
 * Shared pan/zoom logic for SVG canvases (10 §4 shared components). Genuinely
 * reused by the Scanner ECU-network map and the Schematic wiring canvas, which
 * previously duplicated identical drag/zoom/fit code. Consumers render their own
 * SVG + controls (layouts differ) and drive them from this hook, or use the
 * <PanZoomSvg> wrapper for the common case.
 */
export interface PanZoomOptions {
  min?: number;
  max?: number;
  step?: number;
  initialZoom?: number;
}

export function usePanZoom(opts: PanZoomOptions = {}) {
  const { min = 0.6, max = 2.4, step = 0.2, initialZoom = 1 } = opts;
  const clamp = (z: number) => Math.max(min, Math.min(max, z));
  const [z, setZ] = useState(initialZoom);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const zoomIn = () => setZ((v) => clamp(v + step));
  const zoomOut = () => setZ((v) => clamp(v - step));
  const zoomBy = (delta: number) => setZ((v) => clamp(v + delta));
  const fit = () => {
    setZ(initialZoom);
    setTx(0);
    setTy(0);
  };

  const containerProps = {
    onMouseDown: (e: React.MouseEvent) => (drag.current = { x: e.clientX, y: e.clientY }),
    onMouseUp: () => (drag.current = null),
    onMouseLeave: () => (drag.current = null),
    onMouseMove: (e: React.MouseEvent) => {
      if (!drag.current) return;
      setTx((v) => v + (e.clientX - drag.current!.x));
      setTy((v) => v + (e.clientY - drag.current!.y));
      drag.current = { x: e.clientX, y: e.clientY };
    },
    style: { cursor: drag.current ? "grabbing" : "grab" } as React.CSSProperties,
  };

  return { z, tx, ty, groupTransform: `translate(${tx} ${ty}) scale(${z})`, zoomIn, zoomOut, zoomBy, fit, containerProps };
}

/** Wrapper: a pan/zoom-enabled SVG whose children are placed in a transform group. */
export function PanZoomSvg({
  viewBox,
  className,
  ariaLabel,
  children,
  pan,
}: {
  viewBox: string;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
  pan: ReturnType<typeof usePanZoom>;
}) {
  return (
    <div className={className} dir="ltr" {...pan.containerProps}>
      <svg viewBox={viewBox} width="100%" height="100%" role="img" aria-label={ariaLabel} aria-hidden>
        <g transform={pan.groupTransform}>{children}</g>
      </svg>
    </div>
  );
}
