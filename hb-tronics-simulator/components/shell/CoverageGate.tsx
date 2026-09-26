"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { useAppStoreApi } from "@/providers/StoreProvider";
import { MODS } from "@/data/shared/modules";
import type { ToolId, Coverage } from "@/data/schema";

/**
 * Coverage gate (02 #15 / 10 §13). Replaces a tool when the active vehicle lacks
 * a data pack — never renders fabricated data. Not a separate route.
 */
export function CoverageGate({ tool, coverage }: { tool: ToolId; coverage: Coverage }) {
  const t = useTranslations("shell.gate");
  const tt = useTranslations("shell.toast");
  const ta = useTranslations("common.action");
  const api = useAppStoreApi();
  const mod = MODS.find((m) => m.id === tool)!;

  return (
    <div className="flex flex-1 items-center justify-center bg-paper2 p-8">
      <div className="max-w-md rounded-xl border border-line bg-paper p-8 text-center shadow-card">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl"
          style={{ background: mod.accentBg, color: mod.accent }}
        >
          <Icon name={mod.id} size={28} />
        </span>
        <div className="t-eyebrow mt-4 text-neutralx-fg3">{t("kicker")}</div>
        <h2 className="t-title mt-1 text-ink" style={{ fontSize: 20 }}>
          {coverage === "avail" ? t("notInstalled") : t("noData")}
        </h2>
        <p className="t-body mt-2 text-neutralx-fg3">{t("body")}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => api.getState().say(coverage === "avail" ? tt("installRequested") : tt("coverageRequested"))}
            className="focus-ring rounded-lg bg-brand px-4 py-2 t-cta text-brand-on"
          >
            {coverage === "avail" ? ta("install") : ta("request")}
          </button>
          <button
            type="button"
            onClick={() => api.getState().setVehicle("corolla")}
            className="focus-ring rounded-lg border border-line2 bg-paper px-4 py-2 t-cta text-ink hover:border-brand"
          >
            {t("switch")}
          </button>
        </div>
      </div>
    </div>
  );
}
