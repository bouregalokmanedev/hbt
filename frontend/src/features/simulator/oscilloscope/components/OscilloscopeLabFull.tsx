import { useState } from "react";
import { readVehicleItem, removeVehicleItem, writeVehicleItem } from "@/features/simulator/lib/vehicleStorage";
import { useTranslation } from "react-i18next";

import { VehicleGate } from "@/features/simulator/scanner/components/VehicleGate";
import { OscilloscopeView } from "./OscilloscopeView";

const SCOPE_VEHICLE_KEY = "hbt:scope-vehicle";

export function OscilloscopeLabFull({ sessionId = null }: { sessionId?: string | null }) {
    const { t } = useTranslation();
    const [vehicleId, setVehicleId] = useState<string | null>(() => readVehicleItem(SCOPE_VEHICLE_KEY));

    if (!vehicleId) {
        return (
            <VehicleGate
                tool="oscilloscope"
                onSelect={(id) => {
                    writeVehicleItem(SCOPE_VEHICLE_KEY, id);
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
                        removeVehicleItem(SCOPE_VEHICLE_KEY);
                        setVehicleId(null);
                    }}
                    className="rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#3A3A3A]/60 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60"
                >
                    {t("simulator.lab.vehicleGate.switch", { defaultValue: "Switch vehicle" }) as string} · {vehicleId}
                </button>
            </div>
            <OscilloscopeView vehicleId={vehicleId} sessionId={sessionId} />
        </div>
    );
}
