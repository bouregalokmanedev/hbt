import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
    dtc: string;
    liveData: string;
    interpretation: string;
    onDtcChange(v: string): void;
    onLiveDataChange(v: string): void;
    onInterpretationChange(v: string): void;
};

const DTCS = [
    { code: "P2118", desc: "Throttle actuator current", status: "Current", ecu: "ECM" },
    { code: "P0087", desc: "Fuel rail pressure low", status: "Stored", ecu: "ECM" },
    { code: "U0129", desc: "Lost comm w/ brakes", status: "Pending", ecu: "ABS" },
    { code: "C1201", desc: "ESC control", status: "Current", ecu: "ABS" },
] as const;

const PIDS = [
    { pid: "RPM", unit: "rpm" },
    { pid: "TPS", unit: "%" },
    { pid: "ECT", unit: "°C" },
    { pid: "VBAT", unit: "V" },
    { pid: "MAP", unit: "kPa" },
    { pid: "MAF", unit: "g/s" },
] as const;

export function ScannerPanel({ dtc, liveData, interpretation, onDtcChange, onLiveDataChange, onInterpretationChange }: Props) {
    const { t } = useTranslation();
    const [scanning, setScanning] = useState(false);
    const [live, setLive] = useState<Record<string, string>>({ RPM: "780", TPS: "12", ECT: "84", VBAT: "12.4", MAP: "98", MAF: "8.2" });
    const [selDtc, setSelDtc] = useState<string | null>(null);

    useEffect(() => {
        if (!scanning) return;
        const id = window.setInterval(() => {
            setLive(() => ({
                RPM: String(760 + Math.floor(Math.random() * 40)),
                TPS: (11 + Math.random() * 2).toFixed(1),
                ECT: String(83 + Math.floor(Math.random() * 3)),
                VBAT: (12.3 + Math.random() * 0.3).toFixed(1),
                MAP: String(97 + Math.floor(Math.random() * 4)),
                MAF: (8 + Math.random() * 0.6).toFixed(1),
            }));
        }, 420);
        return () => window.clearInterval(id);
    }, [scanning]);

    return (
        <div className="space-y-3">
            <div className="rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329] p-3">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.scanner.title")}</p>
                    <button type="button" onClick={() => setScanning((v) => !v)} className={`h-7 rounded-full px-3 text-xs font-bold ${scanning ? "bg-emerald-600 text-white" : "bg-[#3A3A3A] text-white"}`}>{scanning ? `● ${t("diagnostics.tools.scan.scanning")} 420ms` : t("diagnostics.tools.scan.scan")}</button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {["CAN-B 125k", "CAN-C 500k", "CAN-FD 2M"].map((bus) => (
                        <div key={bus} className="rounded-lg bg-white dark:bg-[#1b1b20] p-1.5 text-center text-[10px] font-mono leading-none">
                            <span className="block font-bold">{bus}</span>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400">ECM · ABS · BCM</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 bg-white dark:bg-[#1b1b20]">
                <p className="bg-[#0f1115] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white/60">{t("diagnostics.tools.scanner.dtc")}</p>
                <div className="divide-y divide-[#3A3A3A]/10 dark:divide-white/10">
                    {DTCS.map((row) => (
                        <button key={row.code} type="button" onClick={() => { setSelDtc(row.code); onDtcChange(row.code); }} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${selDtc === row.code ? "bg-[#F47822]/10" : "hover:bg-[#FCFCFC] dark:hover:bg-[#232329]"}`}>
                            <span className={`h-2 w-2 rounded-full ${row.status === "Current" ? "bg-red-500" : row.status === "Stored" ? "bg-amber-500" : "bg-zinc-400"}`} />
                            <span className="font-mono font-bold">{row.code}</span>
                            <span className="flex-1 truncate text-[#3A3A3A]/70 dark:text-white/70">{row.desc}</span>
                            <span className="rounded-full bg-[#3A3A3A]/10 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold">{row.ecu} · {row.status}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 bg-[#080a0e] p-2">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-white/60">{t("diagnostics.tools.scanner.liveNote")} · {scanning ? t("diagnostics.tools.scan.streaming") : t("diagnostics.tools.scan.paused")}</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {PIDS.map((p) => (
                        <div key={p.pid} className="rounded-lg bg-white/5 p-2 text-center">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">{p.pid}</p>
                            <p className="mt-0.5 font-mono text-sm font-bold text-[#7CFF7C]">{live[p.pid]}<span className="ml-1 text-[10px] text-white/40">{p.unit}</span></p>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => onLiveDataChange(`TPS ${live.TPS}% · ECT ${live.ECT}°C · VBAT ${live.VBAT}V · MAP ${live.MAP}kPa`)} className="mt-2 w-full rounded-lg bg-white/10 py-1.5 text-xs font-bold text-white hover:bg-white/15">{t("diagnostics.tools.scanner.snapshot")}</button>
            </div>

            <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.scanner.dtcRead")}</span>
                <input value={dtc} onChange={(e) => onDtcChange(e.target.value)} placeholder={t("diagnostics.tools.scanner.dtcPh")} className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-[#F47822]" />
            </label>
            <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.scanner.liveNote")}</span>
                <input value={liveData} onChange={(e) => onLiveDataChange(e.target.value)} placeholder={t("diagnostics.tools.scanner.livePh")} className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#F47822]" />
            </label>
            <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.scanner.interp")}</span>
                <textarea value={interpretation} onChange={(e) => onInterpretationChange(e.target.value)} rows={2} placeholder={t("diagnostics.tools.scanner.interpPh")} className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#F47822]" />
            </label>
        </div>
    );
}
