import { useState } from "react";
import { readVehicleItem, removeVehicleItem, writeVehicleItem } from "@/features/simulator/lib/vehicleStorage";
import { VehicleGate } from "@/features/simulator/scanner/components/VehicleGate";
import { MultimeterWorkbench } from "@/features/simulator/multimeter/components/MultimeterWorkbench";

const METER_VEHICLE_KEY = "hbt:meter-vehicle";

export function MultimeterLabFull({ sessionId = null }: { sessionId?: string | null }) {
    const [vehicleId, setVehicleId] = useState<string | null>(() => readVehicleItem(METER_VEHICLE_KEY));
    if (!vehicleId) {
        return (
            <VehicleGate
                tool="multimeter"
                onSelect={(id) => {
                    writeVehicleItem(METER_VEHICLE_KEY, id);
                    setVehicleId(id);
                }}
            />
        );
    }
    return (
        <MultimeterWorkbench
            vehicleId={vehicleId}
            sessionId={sessionId}
            onSwitchVehicle={() => {
                removeVehicleItem(METER_VEHICLE_KEY);
                setVehicleId(null);
            }}
        />
    );
}
