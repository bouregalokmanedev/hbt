"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useAppStoreApi } from "@/providers/StoreProvider";
import { DTCS } from "@/data/scanner";
import { Chip } from "@/components/shared/Chip";
import { DtcDetailTabs } from "./DtcDetailTabs";
import type { ScannerScreenProps } from "./types";

/** Fault-code list with filters, expandable rows, and clear/compare modals (02 §B). */
export function DtcList({ t, engine, state }: ScannerScreenProps) {
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<string | null>("P2118");
  const [modal, setModal] = useState<null | "clear" | "compare">(null);
  const api = useAppStoreApi();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, modal != null);
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);
  const filtered = DTCS.filter((d) => filter === "all" || d.status.toLowerCase() === filter);

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        {["all", "current", "stored", "pending"].map((f) => (
          <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
            {t(`dtcs.${f}`)}
          </Chip>
        ))}
        <div className="ms-auto flex gap-2">
          <button type="button" onClick={() => setModal("compare")} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink hover:border-mod-scanner">
            {t("modal.compare")}
          </button>
          <button type="button" onClick={() => setModal("clear")} className="focus-ring rounded-md border border-[#F0C4C0] px-3 py-1.5 t-cta text-fault-red hover:bg-fault-bg2">
            {t("modal.clearCodes")}
          </button>
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6" onClick={() => setModal(null)}>
          <div ref={modalRef} role="dialog" aria-modal="true" aria-label={modal === "clear" ? t("modal.clearTitle") : t("modal.compareTitle")} className="w-full max-w-md rounded-xl bg-paper p-5 shadow-modal" onClick={(e) => e.stopPropagation()}>
            {modal === "clear" ? (
              <>
                <h3 className="t-section text-ink">{t("modal.clearTitle")}</h3>
                <p className="mt-2 t-body-sm text-neutralx-fg3">{t("modal.clearBody")}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setModal(null)} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">Cancel</button>
                  <button type="button" onClick={() => { api.getState().say(t("modal.cleared")); setModal(null); }} className="focus-ring rounded-md bg-fault-red px-3 py-1.5 t-cta text-white">
                    {t("modal.clearConfirm")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="t-section text-ink">{t("modal.compareTitle")}</h3>
                <p className="mt-2 t-body-sm text-neutralx-fg3">{t("modal.compareBody")}</p>
                <div className="mt-3 space-y-1.5">
                  {[
                    { code: "P2118", change: "new" },
                    { code: "C1201", change: "new" },
                    { code: "P0113", change: "cleared" },
                  ].map((r) => (
                    <div key={r.code} className="flex items-center justify-between rounded-md bg-fill px-3 py-2">
                      <span dir="ltr" className="t-code text-ink">{r.code}</span>
                      <span className={cn("t-code", r.change === "new" ? "text-fault" : "text-ok")}>{r.change === "new" ? "+ NEW" : "− CLEARED"}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => setModal(null)} className="focus-ring rounded-md bg-mod-scanner px-3 py-1.5 t-cta text-white">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {filtered.map((d) => (
          <div key={d.code} className="rounded-lg border border-line bg-paper">
            <button type="button" onClick={() => setOpen(open === d.code ? null : d.code)} className="focus-ring flex w-full items-center gap-3 px-4 py-3 text-start">
              <span
                dir="ltr"
                className="t-code rounded-xs px-1.5 py-0.5"
                style={
                  d.severity === "high"
                    ? { background: "#FDECEA", color: "#B42318" }
                    : d.severity === "medium"
                      ? { background: "#FFF3E8", color: "#B4560F" }
                      : { background: "#F5F6F7", color: "#6B7280" }
                }
              >
                {d.code}
              </span>
              <span className="flex-1 t-body-sm text-ink">{d.desc}</span>
              <span className="t-eyebrow text-neutralx-fg3">{d.status}</span>
            </button>
            {open === d.code && d.code === "P2118" ? <DtcDetailTabs t={t} engine={engine} state={state} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
