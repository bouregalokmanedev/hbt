import { useTranslation } from "react-i18next";
import { CrumbBar, TopBar } from "./chrome";
import { flatScanEcus, type ScanFaults } from "./scan";
import { loadEcuSystems } from "./systemsData";
import type { DiagnosisBrand, DiagnosisVariant, DetectionMode } from "./data";

/* Quick Read Code: lists every fault code the automatic scan found. */

type Props = {
    brand: DiagnosisBrand;
    variant: DiagnosisVariant;
    mode: DetectionMode;
    scanResult: ScanFaults;
    vciConnected: boolean;
    onBack: () => void;
};

export function QuickReadScreen({
    brand,
    variant,
    mode,
    scanResult,
    vciConnected,
    onBack,
}: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";

    const allEcus = flatScanEcus(loadEcuSystems(variant.id));
    const entries = allEcus.flatMap((ecu) =>
        (scanResult[ecu.id] ?? []).map((dtc) => ({
            key: `${ecu.id}-${dtc.id}`,
            ecuName: ecu.name,
            code: dtc.code,
            desc: dtc.desc,
            severity: dtc.severity,
        })),
    );

    const crumb = `${brand.name} ${brand.version} > ${
        mode === "auto" ? t(`${cs}.automaticDetection`) : t(`${cs}.manualDetection`)
    } > ${t(`${cs}.quickRead`)}`;

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onBack} title={t(`${cs}.quickRead`)} vciConnected={vciConnected} />
            <CrumbBar text={crumb} />
            <div
                className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ background: "#e9ebef" }}
            >
                {entries.length === 0 ? (
                    <p
                        className="grid h-full place-items-center text-[#7d8590]"
                        style={{ fontSize: "1.6cqw" }}
                    >
                        {t(`${cs}.scanNoFaults`)}
                    </p>
                ) : (
                    entries.map((entry, index) => (
                        <div
                            key={entry.key}
                            className="grid items-center border-b border-[#d5d9df]"
                            style={{
                                gridTemplateColumns: "4cqw 17cqw 10cqw 1fr 11cqw",
                                background: index % 2 === 0 ? "#ffffff" : "#eef1f5",
                            }}
                        >
                            <span
                                className="px-[1cqw] py-[1.5cqw] text-[#4a4f57]"
                                style={{ fontSize: "1.4cqw" }}
                            >
                                {index + 1}
                            </span>
                            <span
                                className="px-[1.4cqw] py-[1.5cqw] font-semibold text-[#33383f]"
                                style={{ fontSize: "1.45cqw" }}
                            >
                                {entry.ecuName}
                            </span>
                            <span
                                className="px-[1.4cqw] py-[1.5cqw] font-semibold text-[#c0392b]"
                                style={{ fontSize: "1.45cqw" }}
                            >
                                {entry.code}
                            </span>
                            <span
                                className="px-[1.4cqw] py-[1.5cqw] text-[#4a4f57]"
                                style={{ fontSize: "1.45cqw" }}
                            >
                                {entry.desc}
                            </span>
                            <span className="px-[1.4cqw] py-[1.5cqw] text-end">
                                {entry.severity ? (
                                    <span
                                        className="rounded-full border border-[#e5c07b] bg-[#fdf3e3] px-[1cqw] py-[0.25cqw] font-semibold text-[#b06a00]"
                                        style={{ fontSize: "1.15cqw" }}
                                    >
                                        {entry.severity}
                                    </span>
                                ) : null}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
