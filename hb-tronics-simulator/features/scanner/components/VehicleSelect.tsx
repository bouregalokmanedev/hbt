"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useAppStoreApi } from "@/providers/StoreProvider";
import { MANUFACTURERS, BRAND_COUNT, RECENT_USED } from "../data/vehicleDb";

/**
 * Local Diagnostic — Vehicle Selection (SC, doc 17/19). Faithful 4-column
 * drill-down: Manufacturer → Model → Year·Engine·Transmission → Vehicle profile,
 * with VIN/auto-identify and recently-used chips. Vehicle data is Class-B canonical
 * (data/vehicleDb.ts); chrome labels are localized (scanner namespace).
 */
export function VehicleSelect({ t }: { t: any }) {
  const api = useAppStoreApi();
  const [q, setQ] = useState("");
  const [code, setCode] = useState("TO");
  const [model, setModel] = useState<string | null>(null);
  const [variant, setVariant] = useState<number | null>(null);

  const brands = MANUFACTURERS.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));
  const active = MANUFACTURERS.find((b) => b.code === code)!;
  const activeModel = active.models.find((m) => m.model === model);
  const chosen = variant != null && activeModel ? activeModel.variants[variant] : null;
  const step = variant != null ? 3 : model ? 2 : 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* VIN / auto-identify + recently used */}
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="t-eyebrow text-neutralx-fg3">{t("select.vinLabel")}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              dir="ltr"
              value={q === "__vin" ? "" : undefined}
              placeholder={t("select.vinPlaceholder")}
              className="focus-ring h-[38px] w-64 rounded-lg border border-line2 bg-paper2 px-3 t-body-sm outline-none"
              onChange={() => {}}
            />
            <button
              type="button"
              onClick={() => api.getState().say("VIN JTNBV58E90J123456 → Toyota Corolla 1ZR-FE")}
              className="focus-ring flex items-center gap-2 rounded-lg bg-[#14181C] px-4 py-2 t-cta text-white"
            >
              ⧉ {t("select.autoId")}
            </button>
          </div>
        </div>
        <div>
          <div className="t-eyebrow text-neutralx-fg3">{t("select.recentUsed")}</div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {RECENT_USED.map((r, i) => (
              <button key={i} type="button" onClick={() => api.getState().say(`${r.name} set active`)} className="focus-ring flex items-center gap-2 rounded-lg border border-line2 bg-paper px-3 py-1.5 t-body-sm text-ink hover:border-mod-scanner">
                <span dir="ltr" className="t-code rounded-xs bg-mod-scannerBg px-1 py-0.5 text-mod-scanner">{r.code}</span>
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-column drill-down */}
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-4">
        {/* Manufacturer */}
        <Column label={`1 · ${t("select.manufacturer")}`} head={
          <input dir="ltr" value={q === "__vin" ? "" : q} onChange={(e) => setQ(e.target.value)} placeholder={t("select.searchBrands", { n: BRAND_COUNT })} className="focus-ring h-7 w-40 rounded-md border border-line2 bg-paper2 px-2 t-code outline-none" />
        }>
          {brands.map((b) => (
            <button key={b.code} type="button" onClick={() => { setCode(b.code); setModel(null); setVariant(null); }}
              className={cn("focus-ring flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start t-body-sm", b.code === code ? "bg-mod-scannerBg text-mod-scanner" : "text-ink hover:bg-fill")}>
              <span dir="ltr" className="t-code w-5 shrink-0 text-neutralx-fg3">{b.code}</span>
              <span className="flex-1">{b.name}</span>
              {b.favourite ? <span className="text-warn">★</span> : null}
              <span dir="ltr" className="t-code text-neutralx-fg2">{b.region}</span>
            </button>
          ))}
        </Column>

        {/* Model */}
        <Column label={`2 · ${t("select.model")} · ${active.name.toUpperCase()}`}>
          {active.models.map((m) => (
            <button key={m.model} type="button" onClick={() => { setModel(m.model); setVariant(null); }}
              className={cn("focus-ring flex w-full items-center justify-between rounded-md px-2.5 py-2 text-start t-body-sm", m.model === model ? "bg-mod-scannerBg text-mod-scanner" : "text-ink hover:bg-fill")}>
              <span>{m.model}</span>
              <span dir="ltr" className="t-code text-neutralx-fg2">{m.years}</span>
            </button>
          ))}
        </Column>

        {/* Year · Engine · Transmission */}
        <Column label={`3 · ${t("select.yearEngine")}`}>
          {activeModel ? activeModel.variants.map((v, i) => (
            <button key={i} type="button" onClick={() => setVariant(i)}
              className={cn("focus-ring w-full rounded-lg border p-2.5 text-start", variant === i ? "border-mod-scanner bg-mod-scannerBg" : "border-line3 hover:border-mod-scanner")}>
              <div dir="ltr" className="t-body-sm font-medium text-ink">{v.engine}</div>
              <div dir="ltr" className="t-code text-neutralx-fg3">{v.years} · {v.transmission}</div>
            </button>
          )) : <Empty>{t("select.pickModel")}</Empty>}
        </Column>

        {/* Vehicle profile */}
        <Column label={t("select.profile")}>
          {chosen ? (
            <div className="p-1">
              <div className="t-body font-semibold text-ink">{active.name} {model}</div>
              <dl className="mt-3 space-y-2 t-body-sm">
                <Row k={t("select.engine")} v={chosen.engine} />
                <Row k={t("select.transmission")} v={chosen.transmission} />
                <Row k={t("select.years")} v={chosen.years} />
                <Row k={t("select.region")} v={active.region} />
              </dl>
              <button type="button" onClick={() => api.getState().say(`${active.name} ${model} ${chosen.engine} selected`)} className="focus-ring mt-4 w-full rounded-md bg-mod-scanner px-3 py-2 t-cta text-white">
                {t("select.confirm")}
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <span className="text-neutralx-fg2 text-3xl">⬚</span>
              <p className="mt-2 t-body-sm text-neutralx-fg3">{t("select.profileHint")}</p>
            </div>
          )}
        </Column>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("select.back")}</button>
        <span className="t-eyebrow text-neutralx-fg3">{t("select.stepHint", { n: step })}</span>
        <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">{t("select.coverage")}</button>
      </div>
    </div>
  );
}

function Column({ label, head, children }: { label: string; head?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-line bg-paper">
      <div className="flex items-center justify-between gap-2 border-b border-line3 px-3 py-2">
        <span className="t-eyebrow text-neutralx-fg3">{label}</span>
        {head}
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">{children}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-3 t-body-sm text-neutralx-fg3">{children}</p>;
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="t-eyebrow text-neutralx-fg3">{k}</dt>
      <dd dir="ltr" className="t-code text-ink">{v}</dd>
    </div>
  );
}
