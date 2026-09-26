"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ToolGuard } from "@/components/shell/ToolGuard";
import { useAppStoreApi } from "@/providers/StoreProvider";

const MultimeterView = dynamic(() => import("@/features/multimeter").then((m) => m.MultimeterView), {
  ssr: false,
  loading: () => <div className="p-8 t-body text-neutralx-fg3">Loading bench…</div>,
});

function FocusSync() {
  const params = useSearchParams();
  const api = useAppStoreApi();
  const component = params.get("component");
  useEffect(() => {
    if (component) api.getState().setFocus(component);
  }, [component, api]);
  return null;
}

export default function MultimeterPage() {
  return (
    <ToolGuard tool="multimeter">
      <Suspense>
        <FocusSync />
      </Suspense>
      <MultimeterView />
    </ToolGuard>
  );
}
