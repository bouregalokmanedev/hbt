"use client";

import dynamic from "next/dynamic";
import { ToolGuard } from "@/components/shell/ToolGuard";

const ScannerView = dynamic(() => import("@/features/scanner").then((m) => m.ScannerView), {
  ssr: false,
  loading: () => <div className="p-8 t-body text-neutralx-fg3">Loading scanner…</div>,
});

export default function ScannerPage() {
  return (
    <ToolGuard tool="scanner">
      <ScannerView />
    </ToolGuard>
  );
}
