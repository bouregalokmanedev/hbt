import { CarFront, Cog, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
    CARD_BORDER,
    CARD_BTN,
    CARD_FACE,
    CARD_SHADOW,
    CrumbBar,
    PANE_BG,
    TopBar,
} from "./chrome";
import { SYSTEM_KEYS, type SystemKey } from "./systemsData";
import type { DiagnosisBrand, DiagnosisVariant } from "./data";

/* System Selection screen: the three systems the instructor authored in the
   scanner-lab builder (drivetrain / chassis / body). */

type Props = {
    brand: DiagnosisBrand;
    variant: DiagnosisVariant;
    vciConnected: boolean;
    onBack: () => void;
    onPickSystem: (systemKey: SystemKey) => void;
};

const SYSTEM_ICONS: Record<SystemKey, typeof Cog> = {
    drivetrain: Cog,
    chassis: Wrench,
    body: CarFront,
};

export function SystemsScreen({
    brand,
    vciConnected,
    onBack,
    onPickSystem,
}: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar
                onBack={onBack}
                title={t(`${cs}.systemSelection`)}
                vciConnected={vciConnected}
            />
            <CrumbBar text={`${brand.name} ${brand.version} > ${t(`${cs}.mainMenu`)}`} />

            <div
                className="flex min-h-0 flex-1 items-center justify-center px-[6cqw]"
                style={{ background: PANE_BG }}
            >
                <div className="grid w-full max-w-[1000px] grid-cols-3 gap-[2.2cqw]">
                    {SYSTEM_KEYS.map((key) => {
                        const Icon = SYSTEM_ICONS[key];
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onPickSystem(key)}
                                aria-label={t(`${cs}.systemNames.${key}`)}
                                className={`flex flex-col items-center justify-center gap-[1.2cqw] px-[1.4cqw] py-[2cqw] ${CARD_BTN}`}
                                style={{
                                    background: CARD_FACE,
                                    border: `1px solid ${CARD_BORDER}`,
                                    boxShadow: CARD_SHADOW,
                                    aspectRatio: "1.14 / 1",
                                }}
                            >
                                <Icon
                                    strokeWidth={1.7}
                                    className="text-[#5a6572]"
                                    style={{ width: "6.6cqw", height: "6.6cqw" }}
                                />
                                <span
                                    className="px-[4%] text-center leading-tight font-bold text-[#3d4450]"
                                    style={{ fontSize: "2.05cqw" }}
                                >
                                    {t(`${cs}.systemNames.${key}`)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
