import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    CARD_BORDER,
    CARD_FACE,
    CARD_SHADOW,
    CrumbBar,
    PANE_BG,
    TopBar,
} from "./chrome";
import { EcuMenuScreen } from "./EcuMenuScreen";
import type { EcuDtc } from "@/features/instructor/data/vehicleSystems";
import { loadEcuSystems, type EcuNode, type SystemKey } from "./systemsData";
import type { DiagnosisBrand, DiagnosisVariant } from "./data";

/* ECU cards screen: every control unit the instructor authored under the
   picked system. Tapping a card opens the ECU function menu. */

type Props = {
    brand: DiagnosisBrand;
    variant: DiagnosisVariant;
    systemKey: SystemKey;
    /** Fault codes found by the automatic scan, keyed by ECU id. */
    scanResult: Record<string, EcuDtc[]>;
    vciConnected: boolean;
    onBack: () => void;
    /** Clear one ECU's scan faults. */
    onClearEcuFaults: (ecuId: string) => void;
};

export function EcuCardsScreen({
    brand,
    variant,
    systemKey,
    scanResult,
    vciConnected,
    onBack,
    onClearEcuFaults,
}: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";
    const systems = useMemo(() => loadEcuSystems(variant.id), [variant.id]);
    const ecus = systems[systemKey];
    const systemName = t(`${cs}.systemNames.${systemKey}`);
    const [menuEcu, setMenuEcu] = useState<EcuNode | null>(null);

    if (menuEcu) {
        return (
            <EcuMenuScreen
                ecu={menuEcu}
                crumbText={`${brand.name} ${brand.version} > ${systemName} > ${menuEcu.name}`}
                faults={scanResult[menuEcu.id] ?? []}
                vciConnected={vciConnected}
                onBack={() => setMenuEcu(null)}
                onClearFaults={() => onClearEcuFaults(menuEcu.id)}
            />
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar
                onBack={onBack}
                title={t(`${cs}.ecuCards`)}
                vciConnected={vciConnected}
            />
            <CrumbBar text={`${brand.name} ${brand.version} > ${systemName}`} />

            <div
                className="relative min-h-0 flex-1"
                style={{ background: PANE_BG }}
            >
                {ecus.length === 0 ? (
                    <p
                        className="grid h-full place-items-center text-[#7d8590]"
                        style={{ fontSize: "1.6cqw" }}
                    >
                        {t(`${cs}.noEcus`)}
                    </p>
                ) : (
                    <div className="h-full overflow-y-auto p-[1.8cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="grid grid-cols-5 gap-[1.4cqw]">
                            {ecus.map((ecu) => (
                                <button
                                    key={ecu.id}
                                    type="button"
                                    aria-label={ecu.name}
                                    onClick={() => setMenuEcu(ecu)}
                                    className="flex flex-col items-center justify-center gap-[1.1cqw] rounded-[0.7cqw] px-[6%] py-[1.4cqw] text-center transition duration-150 hover:brightness-[1.03] active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                                    style={{
                                        background: CARD_FACE,
                                        border: `1px solid ${CARD_BORDER}`,
                                        boxShadow: CARD_SHADOW,
                                        aspectRatio: "1.14 / 1",
                                    }}
                                >
                                    <span
                                        className="px-[2%] leading-tight font-bold text-[#3d4450]"
                                        style={{ fontSize: "1.5cqw" }}
                                    >
                                        {ecu.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
