import { useState } from "react";
import { readVehicleItem, removeVehicleItem, writeVehicleItem } from "@/features/simulator/lib/vehicleStorage";
import { useTranslation } from "react-i18next";

import { VehicleGate } from "@/features/simulator/scanner/components/VehicleGate";
import { SchematicView } from "@/features/simulator/schematic/components/SchematicView";

const SCHEMATIC_VEHICLE_KEY = "hbt:schematic-vehicle";

export function SchematicLabFull({ sessionId = null }: { sessionId?: string | null }) {
    const { t } = useTranslation();
    const [vehicleId, setVehicleId] = useState<string | null>(() => readVehicleItem(SCHEMATIC_VEHICLE_KEY));

    if (!vehicleId) {
        return (
            <VehicleGate
                tool="schematic"
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
