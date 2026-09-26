"use client";

import { CoverageGate } from "./CoverageGate";
import { useAppStore } from "@/providers/StoreProvider";
import type { ToolId } from "@/data/schema";

/** Renders the tool only when the active vehicle has coverage; else the gate. */
export function ToolGuard({ tool, children }: { tool: ToolId; children: React.ReactNode }) {
  const coverage = useAppStore((s) => s.coverage(tool));
  if (coverage !== "ok") return <CoverageGate tool={tool} coverage={coverage} />;
  return <>{children}</>;
}
