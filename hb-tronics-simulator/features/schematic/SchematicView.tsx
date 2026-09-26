"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { useSchematicWorkspace } from "./hooks/useSchematicWorkspace";
import { TopBar, SubBar } from "./components/Bars";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { Inspector } from "./components/Inspector";
import { Overlays } from "./components/Overlays";

/**
 * Schematic tool shell (P6.2) — the authentic single-sheet R16 wiring workspace on
 * the framework-free SchematicWorkspaceEngine. Top bar + sub bar + 3-region body
 * (Sidebar / Canvas·CircuitGraph / Inspector) + overlays. Layout A/B/C repositions
 * the inspector; the sidebar collapses to a drawer below lg. No domain logic here.
 */
export function SchematicView() {
  const t = useTranslations("schematic");
  const tc = useTranslations("content");
  const { engine, state } = useSchematicWorkspace();
  const [layout, setLayout] = useState<"a" | "b" | "c">("a");

  const inspector = <Inspector engine={engine} state={state} t={t} tc={tc} />;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-paper2">
      <TopBar engine={engine} state={state} t={t} />
      <SubBar engine={engine} state={state} t={t} tc={tc} layout={layout} setLayout={setLayout} />

      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar — inline on lg+, drawer overlay below lg */}
        <div className="hidden lg:flex">
          <Sidebar engine={engine} state={state} t={t} tc={tc} />
        </div>
        {state.drawer ? (
          <>
            <div onClick={() => engine.toggleDrawer()} className="absolute inset-0 z-[41] bg-ink/45 backdrop-blur-md lg:hidden" />
            <div className="absolute inset-y-0 start-0 z-[42] shadow-pop lg:hidden">
              <Sidebar engine={engine} state={state} t={t} tc={tc} />
            </div>
          </>
        ) : null}

        {/* Canvas */}
        <Canvas engine={engine} state={state} t={t} tc={tc} />

        {/* Inspector — layout-dependent placement */}
        {layout === "a" ? (
          <div className="hidden md:flex">{inspector}</div>
        ) : layout === "b" ? (
          <div className="absolute inset-y-3.5 end-3.5 z-[12] hidden overflow-hidden rounded-xl border border-line shadow-pop md:flex">{inspector}</div>
        ) : (
          <div className={cn("absolute inset-x-0 bottom-0 z-[12] hidden h-72 border-t border-line md:block")}>
            <div className="h-full w-full">{inspector}</div>
          </div>
        )}

        <Overlays engine={engine} state={state} t={t} tc={tc} />
      </div>
    </div>
  );
}
