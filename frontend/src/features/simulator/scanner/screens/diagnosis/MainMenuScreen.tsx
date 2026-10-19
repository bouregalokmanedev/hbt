import { useTranslation } from "react-i18next";
import { CrumbBar, PANE_BG, PaneCard, TopBar } from "./chrome";
import type { DiagnosisBrand, DetectionMode } from "./data";

/* Diagnosis main menu — four actions on the grey pane. */

export type DiagnosisMenuAction = "autoScan" | "systemSelection" | "quickRead" | "quickClear";

type Props = {
    brand: DiagnosisBrand;
    mode: DetectionMode;
    vciConnected: boolean;
    onBack: () => void;
    onMenuAction: (action: DiagnosisMenuAction) => void;
};

const MENU: { key: DiagnosisMenuAction; label: string }[] = [
    { key: "autoScan", label: "autoScan" },
    { key: "systemSelection", label: "systemSelection" },
    { key: "quickRead", label: "quickRead" },
    { key: "quickClear", label: "quickClear" },
];

export function MainMenuScreen({ brand, mode, vciConnected, onBack, onMenuAction }: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";

    const crumb = brand.obd2
        ? `${brand.name} ${brand.version}`
        : `${brand.name} ${brand.version} > ${
              mode === "auto" ? t(`${cs}.automaticDetection`) : t(`${cs}.manualDetection`)
          }`;

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onBack} title={t(`${cs}.mainMenu`)} vciConnected={vciConnected} />
            <CrumbBar text={crumb} />

            <div className="min-h-0 flex-1" style={{ background: PANE_BG }}>
                <div className="grid grid-cols-4 gap-[1cqw] p-[1.6cqw]">
                    {MENU.map((item) => (
                        <PaneCard
                            key={item.key}
                            label={t(`${cs}.${item.label}`)}
                            onClick={() => onMenuAction(item.key)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
