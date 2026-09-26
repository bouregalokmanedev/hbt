"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";
import { useChrome } from "@/lib/useBreakpoint";
import { componentByRef } from "@/data/shared/components";
import { MODS } from "@/data/shared/modules";
import type { ToolId } from "@/data/schema";

const JUMP_COL: Record<Exclude<ToolId, "scanner">, "mm" | "scope" | "loc" | "sch"> = {
  multimeter: "mm",
  oscilloscope: "scope",
  location: "loc",
  schematic: "sch",
};

export function ComponentContextBar() {
  const t = useTranslations("shell.context");
  const locale = useLocale();
  const router = useRouter();
  const api = useAppStoreApi();
  const focus = useAppStore((s) => s.focus);
  const { showContextKicker, showToolJumps } = useChrome();

  const comp = focus ? componentByRef(focus) : undefined;

  const jump = (tool: ToolId, enabled: boolean) => {
    if (!enabled) {
      api.getState().say(t("noData", { tool: MODS.find((m) => m.id === tool)?.name ?? tool }));
      return;
    }
    router.push(`/${locale}/tools/${tool}${focus ? `?component=${focus}` : ""}`);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => api.getState().openPicker()}
        className={cn(
          "focus-ring flex items-center gap-2 rounded-lg border px-2.5 py-1.5",
          comp ? "border-[rgba(244,120,34,0.34)] bg-[rgba(244,120,34,0.08)]" : "border-line2 bg-paper2",
        )}
      >
        {showContextKicker ? <span className="t-eyebrow text-neutralx-fg3">{t("underTest")}</span> : null}
        {comp ? (
          <>
            <span
              dir="ltr"
              className="t-code rounded-xs px-1.5 py-0.5"
              style={{ color: "#B4560F", background: "rgba(244,120,34,0.16)" }}
            >
              {comp.ref}
            </span>
            <span className="t-body-sm font-medium text-ink">{comp.name}</span>
          </>
        ) : (
          <span className="t-body-sm text-neutralx-fg3">{t("noComponent")}</span>
        )}
        <Icon name={comp ? "swap" : "plus"} size={14} className="text-neutralx-fg3" />
      </button>

      {showToolJumps ? (
        <div className="flex items-center gap-1">
          {MODS.map((m) => {
            const enabled = m.id === "scanner" || comp != null && comp[JUMP_COL[m.id as Exclude<ToolId, "scanner">]] != null;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => jump(m.id, !!enabled)}
                title={enabled ? t("jumpTo", { tool: m.name }) : t("noData", { tool: m.name })}
                className={cn(
                  "focus-ring flex h-8 items-center rounded-md px-2 t-code transition-colors",
                  enabled ? "text-ink hover:bg-fill" : "cursor-not-allowed text-neutralx-fg2",
                )}
                style={enabled ? { color: m.accent } : undefined}
                disabled={!enabled}
              >
                {m.tag}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
