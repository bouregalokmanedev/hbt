import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VehicleGridScreen } from "./VehicleGridScreen";
import { DetectionScreen } from "./DetectionScreen";
import { VehicleProfileModal } from "./VehicleProfileModal";
import {
    MainMenuScreen,
    type DiagnosisMenuAction,
} from "./MainMenuScreen";
import { SystemsScreen } from "./SystemsScreen";
import { EcuCardsScreen } from "./EcuCardsScreen";
import { AutoScanScreen } from "./AutoScanScreen";
import { QuickReadScreen } from "./QuickReadScreen";
import { ModalShell, ObdGateModal } from "./chrome";
import type { SystemKey } from "./systemsData";
import type { ScanFaults } from "./scan";
import {
    loadDiagnosisBrands,
    loadMyVehicles,
    saveMyVehicle,
    type DiagnosisBrand,
    type DiagnosisVariant,
    type DetectionMode,
    type SavedVehicle,
} from "./data";

export type { DiagnosisMenuAction };

/* Diagnosis flow state machine:
   vehicles → (pick, OBD check) → detection → automatic → profile popup →
   main menu → automatic scan (random faults per scan) / quick read /
   quick clear (confirm popup) / system selection
   (drivetrain/chassis/body) → ECU cards → ECU function menu.
   OBD II and Manual Detection skip the profile popup.
   Back chains: ecus → systems → menu → detection → vehicles → home. */

type Screen =
    | { id: "vehicles" }
    | { id: "detection"; brand: DiagnosisBrand; variant: DiagnosisVariant }
    | {
          id: "menu";
          brand: DiagnosisBrand;
          variant: DiagnosisVariant;
          mode: DetectionMode;
      }
    | {
          id: "scan";
          brand: DiagnosisBrand;
          variant: DiagnosisVariant;
          mode: DetectionMode;
      }
    | {
          id: "quickRead";
          brand: DiagnosisBrand;
          variant: DiagnosisVariant;
          mode: DetectionMode;
      }
    | {
          id: "systems";
          brand: DiagnosisBrand;
          variant: DiagnosisVariant;
          mode: DetectionMode;
      }
    | {
          id: "systemEcus";
          brand: DiagnosisBrand;
          variant: DiagnosisVariant;
          mode: DetectionMode;
          systemKey: SystemKey;
      };

type Props = {
    onExit: () => void;
    vciConnected?: boolean;
    onMenuAction?: (action: DiagnosisMenuAction) => void;
};

export function DiagnosisFlow({ onExit, vciConnected = false, onMenuAction }: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";
    const [screen, setScreen] = useState<Screen>({ id: "vehicles" });
    const [confirming, setConfirming] = useState(false);
    const [confirmingClear, setConfirmingClear] = useState(false);
    const [pendingPick, setPendingPick] = useState<{
        brand: DiagnosisBrand;
        variant: DiagnosisVariant;
    } | null>(null);
    const [brands, setBrands] = useState<DiagnosisBrand[]>([]);
    const [loading, setLoading] = useState(true);
    const [myVehicles, setMyVehicles] = useState<SavedVehicle[]>(() => loadMyVehicles());
    const [scanResult, setScanResult] = useState<ScanFaults>({});

    useEffect(() => {
        let alive = true;
        loadDiagnosisBrands()
            .then((list) => {
                if (!alive) return;
                setBrands(list);
                setLoading(false);
            })
            .catch(() => {
                if (!alive) return;
                setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    /* Picking a vehicle first shows the "check the OBD connection" popup;
       confirming proceeds with the real pick. */
    const handlePick = (brand: DiagnosisBrand, variant: DiagnosisVariant) => {
        setPendingPick({ brand, variant });
    };

    const proceedPick = (brand: DiagnosisBrand, variant: DiagnosisVariant) => {
        saveMyVehicle({
            brandId: brand.id,
            brandName: brand.name,
            version: brand.version,
            obd2: brand.obd2,
            variant,
        });
        setMyVehicles(loadMyVehicles());
        setScanResult({});

        if (brand.obd2) {
            setScreen({ id: "menu", brand, variant, mode: "auto" });
            return;
        }
        setScreen({ id: "detection", brand, variant });
    };

    const enterMenu = (mode: DetectionMode) => {
        if (screen.id !== "detection") return;
        if (mode === "auto") {
            setConfirming(true);
            return;
        }
        setScreen({ id: "menu", brand: screen.brand, variant: screen.variant, mode });
    };

    const confirmProfile = () => {
        setConfirming(false);
        if (screen.id !== "detection") return;
        setScreen({ id: "menu", brand: screen.brand, variant: screen.variant, mode: "auto" });
    };

    const backFromMenu = () => {
        if (screen.id !== "menu") return;
        if (screen.brand.obd2) {
            setScreen({ id: "vehicles" });
            return;
        }
        setScreen({ id: "detection", brand: screen.brand, variant: screen.variant });
    };

    return (
        <div className="absolute inset-0">
            {screen.id === "vehicles" ? (
                <VehicleGridScreen
                    brands={brands}
                    loading={loading}
                    myVehicles={myVehicles}
                    vciConnected={vciConnected}
                    onExit={onExit}
                    onPick={handlePick}
                />
            ) : null}

            {screen.id === "detection" ? (
                <DetectionScreen
                    brand={screen.brand}
                    vciConnected={vciConnected}
                    onBack={() => setScreen({ id: "vehicles" })}
                    onAutomatic={() => enterMenu("auto")}
                    onManual={() => enterMenu("manual")}
                />
            ) : null}

            {screen.id === "menu" ? (
                <MainMenuScreen
                    brand={screen.brand}
                    mode={screen.mode}
                    vciConnected={vciConnected}
                    onBack={backFromMenu}
                    onMenuAction={(action) => {
                        if (action === "systemSelection") {
                            setScreen({
                                id: "systems",
                                brand: screen.brand,
                                variant: screen.variant,
                                mode: screen.mode,
                            });
                            return;
                        }
                        if (action === "autoScan") {
                            setScreen({
                                id: "scan",
                                brand: screen.brand,
                                variant: screen.variant,
                                mode: screen.mode,
                            });
                            return;
                        }
                        if (action === "quickRead") {
                            setScreen({
                                id: "quickRead",
                                brand: screen.brand,
                                variant: screen.variant,
                                mode: screen.mode,
                            });
                            return;
                        }
                        if (action === "quickClear") {
                            setConfirmingClear(true);
                            return;
                        }
                        onMenuAction?.(action);
                    }}
                />
            ) : null}

            {screen.id === "scan" ? (
                <AutoScanScreen
                    brand={screen.brand}
                    variant={screen.variant}
                    mode={screen.mode}
                    vciConnected={vciConnected}
                    scanResult={scanResult}
                    onScanResult={setScanResult}
                    onBack={() =>
                        setScreen({
                            id: "menu",
                            brand: screen.brand,
                            variant: screen.variant,
                            mode: screen.mode,
                        })
                    }
                />
            ) : null}

            {screen.id === "quickRead" ? (
                <QuickReadScreen
                    brand={screen.brand}
                    variant={screen.variant}
                    mode={screen.mode}
                    scanResult={scanResult}
                    vciConnected={vciConnected}
                    onBack={() =>
                        setScreen({
                            id: "menu",
                            brand: screen.brand,
                            variant: screen.variant,
                            mode: screen.mode,
                        })
                    }
                />
            ) : null}

            {screen.id === "systems" ? (
                <SystemsScreen
                    brand={screen.brand}
                    variant={screen.variant}
                    vciConnected={vciConnected}
                    onBack={() =>
                        setScreen({
                            id: "menu",
                            brand: screen.brand,
                            variant: screen.variant,
                            mode: screen.mode,
                        })
                    }
                    onPickSystem={(systemKey) =>
                        setScreen({
                            id: "systemEcus",
                            brand: screen.brand,
                            variant: screen.variant,
                            mode: screen.mode,
                            systemKey,
                        })
                    }
                />
            ) : null}

            {screen.id === "systemEcus" ? (
                <EcuCardsScreen
                    brand={screen.brand}
                    variant={screen.variant}
                    systemKey={screen.systemKey}
                    scanResult={scanResult}
                    vciConnected={vciConnected}
                    onClearEcuFaults={(ecuId) =>
                        setScanResult((prev) => {
                            const next = { ...prev };
                            delete next[ecuId];
                            return next;
                        })
                    }
                    onBack={() =>
                        setScreen({
                            id: "systems",
                            brand: screen.brand,
                            variant: screen.variant,
                            mode: screen.mode,
                        })
                    }
                />
            ) : null}

            {confirming && screen.id === "detection" ? (
                <VehicleProfileModal
                    brand={screen.brand}
                    variant={screen.variant}
                    onConfirm={confirmProfile}
                    onCancel={() => setConfirming(false)}
                />
            ) : null}

            {confirmingClear && screen.id === "menu" ? (
                <ModalShell
                    title={t(`${cs}.scanClearTitle`)}
                    cancelLabel={t(`${cs}.cancel`)}
                    okLabel={t(`${cs}.ok`)}
                    onCancel={() => setConfirmingClear(false)}
                    onConfirm={() => {
                        setConfirmingClear(false);
                        setScanResult({});
                    }}
                >
                    <p
                        className="px-[3cqw] py-[2.6cqw] text-center text-[#4a4f57]"
                        style={{ fontSize: "1.55cqw" }}
                    >
                        {t(`${cs}.scanClearBody`)}
                    </p>
                </ModalShell>
            ) : null}

            {pendingPick ? (
                <ObdGateModal
                    mode="check"
                    vciConnected={vciConnected}
                    onCancel={() => setPendingPick(null)}
                    onConfirm={() => {
                        proceedPick(pendingPick.brand, pendingPick.variant);
                        setPendingPick(null);
                    }}
                />
            ) : null}
        </div>
    );
}
