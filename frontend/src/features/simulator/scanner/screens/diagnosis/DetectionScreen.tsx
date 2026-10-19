import { useTranslation } from "react-i18next";
import { PANE_BG, CrumbBar, PaneCard, TopBar } from "./chrome";
import type { DiagnosisBrand } from "./data";

/* Detection mode: choose automatic or manual detection for the picked
   vehicle; breadcrumb shows BRAND + version. */

type Props = {
    brand: DiagnosisBrand;
    vciConnected: boolean;
    onBack: () => void;
    onAutomatic: () => void;
    onManual: () => void;
};

export function DetectionScreen({
    brand,
    vciConnected,
    onBack,
    onAutomatic,
    onManual,
}: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onBack} title={brand.name} vciConnected={vciConnected} />
            <CrumbBar text={`${brand.name} ${brand.version}`} />

            <div
                className="flex min-h-0 flex-1 items-center justify-center px-[6cqw]"
                style={{ background: PANE_BG }}
            >
                <div className="grid w-full max-w-[980px] grid-cols-2 gap-[2.6cqw]">
                    <PaneCard label={t(`${cs}.automaticDetection`)} onClick={onAutomatic} />
                    <PaneCard label={t(`${cs}.manualDetection`)} onClick={onManual} />
                </div>
            </div>
        </div>
    );
}
