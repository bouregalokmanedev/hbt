import { SCH_COLOURS, schByKey, type SchTrace } from "./data/schematic.data";

/** CSS background for a wire colour swatch — White/Black renders as a split. */
export function swatchBg(colour: string): string {
  if (colour === "White/Black") return "linear-gradient(135deg,#fff 0 45%,#1F242E 45% 55%,#fff 55%)";
  return SCH_COLOURS[colour] ?? "#98A2B3";
}

/** Orthogonal polyline through a trace's component centres (E1 steps ride the y=1135 rail). */
export function tracePolyline(trace: SchTrace): { x: number; y: number }[] {
  const pts = trace.steps.map((st, i) => {
    const c = schByKey(st.cmp)!;
    if (st.cmp === "E1") {
      const nb = trace.steps[i + 1] && trace.steps[i + 1].cmp !== "E1" ? trace.steps[i + 1].cmp : trace.steps[i - 1] && trace.steps[i - 1].cmp !== "E1" ? trace.steps[i - 1].cmp : "E1";
      const nc = schByKey(nb) ?? c;
      return { x: nc.x, y: 1135 };
    }
    return { x: c.x, y: c.y };
  });
  if (!pts.length) return [];
  const poly = [{ x: pts[0].x, y: pts[0].y }];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2;
    poly.push({ x: a.x, y: my }, { x: b.x, y: my }, { x: b.x, y: b.y });
  }
  return poly;
}

export function polylineD(poly: { x: number; y: number }[]): string {
  return poly.length ? "M " + poly.map((p) => `${p.x} ${p.y}`).join(" L ") : "";
}

/** Arc-length interpolation of a point at fraction t (0..1) along a polyline —
 * the source's continuous guided-trace dot walk. */
export function pointAt(poly: { x: number; y: number }[], t: number): { x: number; y: number } {
  if (poly.length === 0) return { x: 0, y: 0 };
  if (poly.length === 1) return poly[0];
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < poly.length; i++) {
    const l = Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y);
    segs.push(l);
    total += l;
  }
  let want = t * total, acc = 0;
  for (let i = 0; i < segs.length; i++) {
    if (acc + segs[i] >= want) {
      const f = segs[i] ? (want - acc) / segs[i] : 0;
      return { x: poly[i].x + (poly[i + 1].x - poly[i].x) * f, y: poly[i].y + (poly[i + 1].y - poly[i].y) * f };
    }
    acc += segs[i];
  }
  return poly[poly.length - 1];
}
