/**
 * RTL flip allow-list (14 §8). Only directional glyphs mirror in RTL.
 * Tool glyphs, status marks, component symbols and technical SVGs never flip.
 */
export const directionalIcons = new Set<string>([
  "chevron",
  "chevron-collapse",
  "arrow",
  "arrow-right",
  "arrow-left",
  "breadcrumb-sep",
  "swap", // ⇄ context action
  "next",
  "previous",
  "back",
  "forward",
]);

export function isDirectional(id: string): boolean {
  return directionalIcons.has(id);
}
