import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CrumbBar, TopBar } from "./chrome";
import type { ScanFaults } from "./scan";
import { flatScanEcus } from "./scan";
import { loadEcuSystems } from "./systemsData";
import { saveReport } from "../../lib/scannerReports";
import type { DiagnosisBrand, DiagnosisVariant, DetectionMode } from "./data";

/* DTC Report — full report page in the reference layout: header block,
   Vehicle Information section, Fault Codes section with the per-system
   summary table and Exit / Save actions. Save persists the report to the
   tablet's local store (listed by the Report tile). */

type Props = {
    brand: DiagnosisBrand;
    variant: DiagnosisVariant;
    mode: DetectionMode;
    scanResult: ScanFaults;
    vciConnected: boolean;
    onExit: () => void;
};

const DEVICE_SN = "A30M-WF3BXPQ";
const APP_VERSION = "V4.40.63_9.05";

function stamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function ReportScreen({
    brand,
    variant,
    mode,
    scanResult,
    vciConnected,
    onExit,
}: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";
    const [saved, setSaved] = useState(false);

    const systems = loadEcuSystems(variant.id);
    const allEcus = flatScanEcus(systems);
    const faulty = allEcus.filter((ecu) => (scanResult[ecu.id]?.length ?? 0) > 0);
    const codeCount = faulty.reduce(
        (sum, ecu) => sum + (scanResult[ecu.id]?.length ?? 0),
        0,
    );

    const routeMode =
        mode === "auto" ? t(`${cs}.automaticDetection`) : t(`${cs}.manualDetection`);
    const route = `${brand.name}-${brand.version} >> ${routeMode} >> ${t(`${cs}.autoScan`)}`;

    const handleSave = () => {
        saveReport({
            brand: brand.name,
            brandVersion: brand.version,
            mode: routeMode,
            vehicleName: variant.model || variant.name,
            year: variant.profile.year,
            vin: variant.profile.vin,
            systemCount: allEcus.length,
            faultySystemCount: faulty.length,
            codeCount,
            faults: scanResult,
            ecuNames: Object.fromEntries(allEcus.map((ecu) => [ecu.id, ecu.name])),
        });
        setSaved(true);
    };

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onExit} title={t(`${cs}.scanReportTitle`)} vciConnected={vciConnected} />
            <CrumbBar text={`${brand.name} ${brand.version} > ${routeMode}`} />

            <div
                className="min-h-0 flex-1 overflow-y-auto bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {/* header */}
                <div className="px-[3cqw] pt-[1.6cqw] pb-[0.8cqw]">
                    <div className="flex items-start justify-between">
                        <div
                            className="text-[#9aa1ab]"
                            style={{ fontSize: "1.15cqw", lineHeight: 1.7 }}
                        >
                            <p>Company:</p>
                            <p>Address:</p>
                            <p>Telephone:</p>
                            <p>S/N: {DEVICE_SN}</p>
                            <p>APP Version: {APP_VERSION}</p>
                        </div>
                        <div className="pb-[1cqw] text-center">
                            <p className="font-bold text-[#222]" style={{ fontSize: "3.4cqw" }}>
                                Report
                            </p>
                            <p className="mt-[0.4cqw] text-[#9aa1ab]" style={{ fontSize: "1.3cqw" }}>
                                {stamp()}
                            </p>
                        </div>
                        <div style={{ width: "18cqw" }} aria-hidden="true" />
                    </div>
                </div>

                <SectionHeader label="Vehicle Information" />
                <div
                    className="grid grid-cols-3 gap-y-[1.2cqw] px-[3cqw] py-[1.6cqw]"
                    style={{ fontSize: "1.4cqw" }}
                >
                    <Field label="Vehicle Name" value={`: ${variant.model || variant.name}`} />
                    <Field label="Year" value={`: ${variant.profile.year}`} />
                    <Field label="VIN" value={`: ${variant.profile.vin}`} />
                    <Field label="Mileage" value=": 43270km" />
                    <Field label="SN" value={`: ${DEVICE_SN}`} />
                    <Field label="Diagnosis Route" value={`: ${route}`} span={3} />
                </div>

                <SectionHeader label="Fault Codes" />
                <p
                    className="px-[3cqw] py-[1.4cqw] font-semibold text-[#4a4f57]"
                    style={{ fontSize: "1.4cqw" }}
                >
                    <span className="text-[#2a7be4]">{allEcus.length}</span> systems
                    detected: <span className="text-[#2a7be4]">{faulty.length}</span>{" "}
                    systems related to fault codes,{" "}
                    <span className="text-[#2a7be4]">{codeCount}</span> fault codes
                </p>

                {/* table */}
                <div
                    className="grid items-center border-y border-[#c3c8cf]"
                    style={{
                        gridTemplateColumns: "7cqw 1fr 22cqw",
                        background: "#b9c6e8",
                    }}
                >
                    <span className="px-[1.2cqw] py-[1cqw] font-bold text-[#33383f]" style={{ fontSize: "1.4cqw" }}>
                        NO.
                    </span>
                    <span className="px-[1.2cqw] py-[1cqw] font-bold text-[#33383f]" style={{ fontSize: "1.4cqw" }}>
                        System Name
                    </span>
                    <span className="px-[1.2cqw] py-[1cqw] text-end font-bold text-[#33383f]" style={{ fontSize: "1.4cqw" }}>
                        Status
                    </span>
                </div>
                {faulty.length === 0 ? (
                    <p
                        className="px-[3cqw] py-[2cqw] text-[#7d8590]"
                        style={{ fontSize: "1.4cqw" }}
                    >
                        {t(`${cs}.scanNoFaults`)}
                    </p>
                ) : (
                    faulty.map((ecu, index) => (
                        <div
                            key={ecu.id}
                            className="grid items-center border-b border-[#f0d9d9]"
                            style={{
                                gridTemplateColumns: "7cqw 1fr 22cqw",
                                background: "#fdeeee",
                            }}
                        >
                            <span
                                className="px-[1.2cqw] py-[1.3cqw] text-[#c0392b]"
                                style={{ fontSize: "1.4cqw" }}
                            >
                                {index + 1}
                            </span>
                            <span
                                className="px-[1.2cqw] py-[1.3cqw] font-semibold text-[#c0392b]"
                                style={{ fontSize: "1.4cqw" }}
                            >
                                {ecu.name}
                            </span>
                            <span
                                className="px-[1.2cqw] py-[1.3cqw] text-end font-semibold text-[#c0392b]"
                                style={{ fontSize: "1.4cqw" }}
                            >
                                {t(`${cs}.scanFault`, { count: scanResult[ecu.id]?.length ?? 0 })}
                            </span>
                        </div>
                    ))
                )}

                {/* actions */}
                <div className="flex justify-end gap-[1.4cqw] px-[3cqw] py-[2cqw]">
                    <button
                        type="button"
                        onClick={onExit}
                        className="rounded-[0.5cqw] px-[3cqw] py-[1.1cqw] font-bold text-white transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                        style={{
                            background: "linear-gradient(180deg, #4a97ec 0%, #2a6fd4 100%)",
                            border: "1px solid #2461bd",
                            fontSize: "1.5cqw",
                        }}
                    >
                        Exit
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saved}
                        className={`rounded-[0.5cqw] px-[3cqw] py-[1.1cqw] font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                            saved ? "cursor-default opacity-70" : "hover:brightness-[1.06]"
                        }`}
                        style={{
                            background: saved
                                ? "linear-gradient(180deg, #46b56e 0%, #2e9450 100%)"
                                : "linear-gradient(180deg, #4a97ec 0%, #2a6fd4 100%)",
                            border: `1px solid ${saved ? "#268345" : "#2461bd"}`,
                            fontSize: "1.5cqw",
                        }}
                    >
                        {saved ? t(`${cs}.scanReportSaved`) : t(`${cs}.scanReportSave`)}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ label }: { label: string }) {
    return (
        <div className="px-[3cqw] pt-[1.4cqw]">
            <span
                className="inline-block rounded-[0.4cqw] px-[1.6cqw] py-[0.9cqw] font-bold text-white"
                style={{
                    background: "linear-gradient(180deg, #4a7fd4 0%, #2a5fb8 100%)",
                    fontSize: "1.5cqw",
                }}
            >
                {label}
            </span>
        </div>
    );
}

function Field({
    label,
    value,
    span = 1,
}: {
    label: string;
    value: string;
    span?: number;
}) {
    return (
        <span
            className="text-[#4a4f57]"
            style={{ gridColumn: `span ${span}` }}
        >
            <span className="font-semibold">{label}</span> {value}
        </span>
    );
}
