"use client";

import dynamic from "next/dynamic";
import { ToolGuard } from "@/components/shell/ToolGuard";

const LocationView = dynamic(() => import("@/features/location").then((m) => m.LocationView), {
  ssr: false,
  loading: () => <div className="p-8 t-body text-neutralx-fg3">Loading atlas…</div>,
});

export default function LocationPage() {
  return (
    <ToolGuard tool="location">
      <LocationView />
    </ToolGuard>
  );
}
