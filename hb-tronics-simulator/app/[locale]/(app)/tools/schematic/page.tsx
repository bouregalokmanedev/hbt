"use client";

import dynamic from "next/dynamic";
import { ToolGuard } from "@/components/shell/ToolGuard";

const SchematicView = dynamic(() => import("@/features/schematic").then((m) => m.SchematicView), {
  ssr: false,
  loading: () => <div className="p-8 t-body text-neutralx-fg3">Loading diagram…</div>,
});

export default function SchematicPage() {
  return (
    <ToolGuard tool="schematic">
      <SchematicView />
    </ToolGuard>
  );
}
