import { useEffect, useState } from "react";
import { readVehicleItem, removeVehicleItem, writeVehicleItem } from "@/features/simulator/lib/vehicleStorage";
import { useTranslation } from "react-i18next";
import { Car, CheckCircle2, Download, Lock } from "lucide-react";

import { VEH, type Coverage } from "@/features/simulator/scanner/data/scanner.data";
import { backendVehicleCards, fetchCatalog, type BackendVehicleCard } from "@/features/simulator/scanner/data/catalog";
import { SchematicView } from "@/features/simulator/schematic/components/SchematicView";

const SCHEMATIC_VEHICLE_KEY = "hbt:schematic-vehicle";

function coverageTone(coverage: Coverage): string {
    if (coverage === "ok") return "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    if (coverage === "avail") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    return "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/40 dark:bg-white/[0.07] dark:text-white/40";
}

function GateCard({
    id,
    name,
    sub,
    vin,
    km,
    coverage,
    installed,
    onSelect,
}: {
    id: string;
    name: string;
    sub: string;
    vin: string;
    km: number;
    coverage: Coverage;
    installed: boolean;
    onSelect: (vehicleId: string) => void;
}) {
    const { t } = useTranslation();
    const blocked = coverage === "none";
    return (
        <div className="rounded-[20px] border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-[15px] font-black text-[#3A3A3A] dark:text-white">{name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#3A3A3A]/50 dark:text-white/50">{sub}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider ${coverageTone(coverage)}`}>
                    {t(`simulator.scannerLab.gate.${coverage}`)}
                </span>
            </div>
            <p className="mt-3 font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                <span dir="ltr">{vin}</span> · <span dir="ltr">{km.toLocaleString()} km</span>
            </p>
            {blocked ? (
                <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]/45 dark:text-white/45">
                    <Lock className="h-3.5 w-3.5" />
                    {t("simulator.scannerLab.gate.blocked")}
                </p>
            ) : (
                <button
                    type="button"
                    onClick={() => onSelect(id)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-black text-white transition hover:bg-black"
                >
                    {installed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Download className="h-4 w-4" />}
                    {t("simulator.scannerLab.gate.select")}
                </button>
            )}
        </div>
    );
}

function SchematicVehicleGate({ onSelect }: { onSelect: (vehicleId: string) => void }) {
    const { t } = useTranslation();
    const [extra, setExtra] = useState<BackendVehicleCard[]>([]);
    useEffect(() => {
        void fetchCatalog().then(() => setExtra(backendVehicleCards("schematic")));
    }, []);
    return (
        <div className="space-y-4">
            <div className="rounded-[20px] border border-[#3A3A3A]/10 bg-white p-6 text-center dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10">
                    <Car className="h-6 w-6 text-[#F47822]" />
                </div>
                <h3 className="mt-4 text-lg font-black text-[#3A3A3A] dark:text-white">{t("simulator.scannerLab.gate.title")}</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-[#3A3A3A]/55 dark:text-white/55">{t("simulator.scannerLab.gate.desc")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {VEH.map((vehicle) => (
                    <GateCard
                        key={vehicle.id}
                        id={vehicle.id}
                        name={vehicle.name}
                        sub={`${vehicle.engine} · ${vehicle.transmission}`}
                        vin={vehicle.vin}
                        km={vehicle.odometerKm}
                        coverage={vehicle.coverage.schematic}
                        installed={vehicle.installed}
                        onSelect={onSelect}
                    />
                ))}
                {extra.map((vehicle) => (
                    <GateCard
                        key={vehicle.key}
                        id={vehicle.key}
                        name={vehicle.name}
                        sub={`${vehicle.engine} · ${vehicle.transmission}`}
                        vin={vehicle.vin}
                        km={vehicle.odometerKm}
                        coverage={vehicle.coverage}
                        installed={false}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}

export function SchematicLabFull({ sessionId = null }: { sessionId?: string | null }) {
    const { t } = useTranslation();
    const [vehicleId, setVehicleId] = useState<string | null>(() => readVehicleItem(SCHEMATIC_VEHICLE_KEY));

    if (!vehicleId) {
        return (
            <SchematicVehicleGate
                onSelect={(id) => {
                    writeVehicleItem(SCHEMATIC_VEHICLE_KEY, id);
                    setVehicleId(id);
                }}
            />
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        removeVehicleItem(SCHEMATIC_VEHICLE_KEY);
                        setVehicleId(null);
                    }}
                    className="rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#3A3A3A]/60 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60"
                >
                    {t("simulator.lab.vehicleGate.switch", { defaultValue: "Switch vehicle" }) as string} · {vehicleId}
                </button>
            </div>
            <SchematicView vehicleId={vehicleId} sessionId={sessionId} />
        </div>
    );
}
