"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { useScannerEngine } from "./hooks/useScannerEngine";
import { EcuNetworkMap } from "./components/EcuNetworkMap";
import { Dashboard } from "./components/Dashboard";
import { VehicleSelect } from "./components/VehicleSelect";
import { Overview } from "./components/Overview";
import { ScanLog } from "./components/ScanLog";
import { SystemsTable } from "./components/SystemsTable";
import { DtcList } from "./components/DtcList";
import { LiveDataTable } from "./components/LiveDataTable";
import { SignalGraph } from "./components/SignalGraph";
import { AdasPanel } from "./components/AdasPanel";
import { Training } from "./screens/Training";
import { History } from "./components/History";
import { ReportScreen } from "./components/ReportScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { AiAssistantPanel } from "./components/AiAssistantPanel";
import { ScannerRail } from "./components/ScannerRail";
import { Workstation } from "./screens/Workstation";
import type { ScannerScreen } from "./screens/types";

/** Scanner tool shell — authentic 66px icon rail + toolbar; each screen is its own
 * component. Landing = the SC-01 Diagnostic Workstation (doc 17 §B). */
export function ScannerView() {
  const t = useTranslations("scanner");
  const { engine, state } = useScannerEngine();
  const [screen, setScreen] = useState<ScannerScreen>("workstation");
  const [proMode, setProMode] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const voltColor = state.volts < 12 ? "#D92D20" : state.volts < 12.5 ? "#B4560F" : "#12A150";

  return (
    <div className="flex min-h-0 flex-1 bg-paper2">
      {/* Scanner 66px icon rail */}
      <ScannerRail screen={screen} go={setScreen} t={t} aiOpen={aiOpen} onToggleAi={() => setAiOpen((o) => !o)} />

      <div className="min-w-0 flex-1 overflow-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-line bg-paper px-5 py-2.5">
          <div className="t-eyebrow text-neutralx-fg3">{t(`nav.${screen}`)}</div>
          <div className="flex items-center gap-3">
            <span dir="ltr" className="t-mono text-xs" style={{ color: voltColor }}>
              ⚡ {state.volts.toFixed(2)} V
            </span>
            <div className="inline-flex rounded-md bg-fill p-0.5">
              {[true, false].map((pro) => (
                <button
                  key={String(pro)}
                  type="button"
                  onClick={() => setProMode(pro)}
                  className={cn("rounded px-2.5 py-1 t-code", proMode === pro ? "bg-paper text-ink shadow-seg" : "text-neutralx-fg3")}
                >
                  {pro ? t("mode.pro") : t("mode.training")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          {screen === "workstation" ? <Workstation go={setScreen} /> : null}
          {screen === "dashboard" ? <Dashboard t={t} volts={state.volts} /> : null}
          {screen === "select" ? <VehicleSelect t={t} /> : null}
          {screen === "overview" ? <Overview t={t} onScan={() => setScreen("scan")} /> : null}
          {screen === "scan" ? <ScanLog t={t} engine={engine} state={state} /> : null}
          {screen === "network" ? <EcuNetworkMap /> : null}
          {screen === "systems" ? <SystemsTable t={t} go={setScreen} /> : null}
          {screen === "dtcs" ? <DtcList t={t} engine={engine} state={state} /> : null}
          {screen === "livedata" ? <LiveDataTable t={t} engine={engine} state={state} /> : null}
          {screen === "graph" ? <SignalGraph t={t} engine={engine} state={state} /> : null}
          {screen === "adas" ? <AdasPanel t={t} engine={engine} state={state} /> : null}
          {screen === "training" ? <Training t={t} engine={engine} state={state} go={setScreen} /> : null}
          {screen === "history" ? <History t={t} go={setScreen} /> : null}
          {screen === "report" ? <ReportScreen t={t} /> : null}
          {screen === "settings" ? <SettingsScreen t={t} /> : null}
        </div>
      </div>

      <AiAssistantPanel t={t} engine={engine} state={state} open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
