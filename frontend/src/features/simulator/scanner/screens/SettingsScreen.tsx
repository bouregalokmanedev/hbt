import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SCANNER_DATASET_VERSION } from "../data/scanner.data";
import type { ScannerEngine } from "../engine/scanner.engine";
import {
    areScannerSoundsMuted,
    setScannerSoundsMuted,
} from "../lib/scanSounds";

export function SettingsScreen({ engine }: { engine: ScannerEngine }) {
    const { t } = useTranslation();
    const snap = engine.getState();
    const [muted, setMuted] = useState(() => areScannerSoundsMuted());
    const rows: { group: string; items: { label: string; value: string }[] }[] = [
        {
            group: t("simulator.scannerLab.settingsScreen.vciTitle"),
            items: [
                { label: t("simulator.scannerLab.settingsScreen.device"), value: "HB-LINK 3" },
                { label: t("simulator.scannerLab.settingsScreen.firmware"), value: "2.8.4" },
                { label: t("simulator.scannerLab.settingsScreen.link"), value: "BT 5.2 · −48 dBm" },
            ],
        },
        {
            group: t("simulator.scannerLab.settingsScreen.unitsTitle"),
            items: [
                { label: t("simulator.scannerLab.settingsScreen.pressure"), value: "bar" },
                { label: t("simulator.scannerLab.settingsScreen.temperature"), value: "°C" },
                { label: t("simulator.scannerLab.settingsScreen.distance"), value: "km" },
            ],
        },
        {
            group: t("simulator.scannerLab.settingsScreen.engineTitle"),
            items: [
                { label: t("simulator.scannerLab.settingsScreen.dataset"), value: SCANNER_DATASET_VERSION },
                { label: t("simulator.scannerLab.settingsScreen.tick"), value: String(snap.tick) },
                { label: "VBAT", value: `${snap.volts.toFixed(2)} V` },
            ],
        },
    ];
    return (
        <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-3">
            {rows.map((card) => (
                <div key={card.group} className="rounded-[20px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                        {card.group}
                    </p>
                    <dl className="mt-3 space-y-2.5">
                        {card.items.map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                                <dt className="text-[#3A3A3A]/55 dark:text-white/55">{row.label}</dt>
                                <dd dir="ltr" className="font-mono text-[13px] font-black text-[#3A3A3A] dark:text-white">
                                    {row.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ))}
            <div className="rounded-[20px] border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                    {t("simulator.scannerLab.settingsScreen.soundsTitle")}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                    <span className="text-[#3A3A3A]/55 dark:text-white/55">
                        {t("simulator.scannerLab.settingsScreen.sounds")}
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={!muted}
                        data-testid="sounds-toggle"
                        onClick={() => {
                            const next = !muted;
                            setMuted(next);
                            setScannerSoundsMuted(next);
                        }}
                        className={`relative h-6 w-11 rounded-full transition ${
                            muted
                                ? "bg-[#3A3A3A]/20 dark:bg-white/20"
                                : "bg-[#2ea44f]"
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                muted ? "left-0.5" : "left-[22px]"
                            }`}
                        />
                    </button>
                </div>
            </div>
            <p className="text-[11px] text-[#3A3A3A]/40 dark:text-white/40 md:col-span-3 dark:text-white/40">
                {t("simulator.scannerLab.settingsScreen.readOnly")}
            </p>
        </div>
    );
}
