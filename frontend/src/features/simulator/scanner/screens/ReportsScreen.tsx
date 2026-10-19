import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Trash2 } from "lucide-react";
import { CrumbBar, TopBar } from "./diagnosis/chrome";
import {
    deleteReport,
    useSavedReports,
    type SavedReport,
} from "../lib/scannerReports";

/* Saved-reports browser shown when the Report tile is tapped. Lists every
   report the student saved from the DTC Report screen; tapping one opens
   a read-only detail, and each can be deleted. */

export function ReportsScreen({ onExit }: { onExit: () => void }) {
    const { t } = useTranslation();
    const th = "simulator.scannerLab.reportsScreen";
    const reports = useSavedReports();
    const [picked, setPicked] = useState<SavedReport | null>(null);

    if (picked) {
        return (
            <ReportDetail
                report={picked}
                onBack={() => setPicked(null)}
                onExit={onExit}
            />
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onExit} title={t(`${th}.title`)} vciConnected />
            <CrumbBar text={t(`${th}.crumb`)} />
            <div
                className="min-h-0 flex-1 overflow-y-auto p-[2cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ background: "#e9ebef" }}
            >
                {reports.length === 0 ? (
                    <div className="grid h-full place-items-center gap-[1cqw] text-center">
                        <FileText
                            aria-hidden="true"
                            className="text-[#9aa1ab]"
                            style={{ width: "6cqw", height: "6cqw" }}
                        />
                        <p
                            className="font-semibold text-[#7d8590]"
                            style={{ fontSize: "1.7cqw" }}
                        >
                            {t(`${th}.empty`)}
                        </p>
                        <p
                            className="text-[#9aa1ab]"
                            style={{ fontSize: "1.4cqw" }}
                        >
                            {t(`${th}.emptyHint`)}
                        </p>
                        <button
                            type="button"
                            onClick={onExit}
                            className="mt-[1cqw] rounded-[0.5cqw] px-[2.6cqw] py-[1cqw] font-bold text-white transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                            style={{
                                background: "linear-gradient(180deg, #4a97ec 0%, #2a6fd4 100%)",
                                border: "1px solid #2461bd",
                                fontSize: "1.4cqw",
                            }}
                        >
                            {t(`${th}.emptyCta`)}
                        </button>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div
                            key={report.id}
                            className="mb-[1.2cqw] flex items-center gap-[1.4cqw] rounded-[0.8cqw] border border-[#d5d9df] bg-white px-[1.6cqw] py-[1.4cqw]"
                        >
                            <FileText
                                aria-hidden="true"
                                className="shrink-0 text-[#2a7be4]"
                                style={{ width: "2.6cqw", height: "2.6cqw" }}
                            />
                            <button
                                type="button"
                                onClick={() => setPicked(report)}
                                className="min-w-0 flex-1 text-start transition hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                            >
                                <p
                                    className="truncate font-bold text-[#33383f]"
                                    style={{ fontSize: "1.6cqw" }}
                                >
                                    {report.vehicleName} · {report.year}
                                </p>
                                <p
                                    className="truncate text-[#7d8590]"
                                    style={{ fontSize: "1.3cqw" }}
                                >
                                    {report.brand} {report.brandVersion} ·{" "}
                                    {t(`${th}.codes`, { count: report.codeCount })} ·{" "}
                                    {new Date(report.savedAt).toLocaleString()}
                                </p>
                            </button>
                            <button
                                type="button"
                                aria-label={t(`${th}.delete`)}
                                onClick={() => deleteReport(report.id)}
                                className="shrink-0 rounded p-[0.5cqw] text-[#c0392b] transition hover:bg-[#fdeeee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c0392b]"
                            >
                                <Trash2
                                    aria-hidden="true"
                                    style={{ width: "1.8cqw", height: "1.8cqw" }}
                                />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ReportDetail({
    report,
    onBack,
    onExit,
}: {
    report: SavedReport;
    onBack: () => void;
    onExit: () => void;
}) {
    const { t } = useTranslation();
    const th = "simulator.scannerLab.reportsScreen";
    const cs = "simulator.scannerLab.diagnosisScreen";

    const faultSystems = Object.entries(report.faults).filter(
        ([, dtcs]) => dtcs.length > 0,
    );

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onBack} title={t(`${th}.detailTitle`)} vciConnected />
            <CrumbBar text={`${report.brand} ${report.brandVersion} > ${report.mode}`} />
            <div
                className="min-h-0 flex-1 overflow-y-auto bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <div
                    className="grid grid-cols-2 gap-y-[1cqw] px-[3cqw] py-[2cqw]"
                    style={{ fontSize: "1.4cqw" }}
                >
                    <DetailField label={t(`${th}.vehicle`)} value={report.vehicleName} />
                    <DetailField label="VIN" value={report.vin} />
                    <DetailField label={t(`${th}.year`)} value={String(report.year)} />
                    <DetailField
                        label={t(`${th}.savedAt`)}
                        value={new Date(report.savedAt).toLocaleString()}
                    />
                </div>

                <p
                    className="px-[3cqw] pb-[1.4cqw] font-semibold text-[#4a4f57]"
                    style={{ fontSize: "1.4cqw" }}
                >
                    <span className="text-[#2a7be4]">{report.systemCount}</span>{" "}
                    {t(`${th}.systemsDetected`)} ·{" "}
                    <span className="text-[#c0392b]">{report.faultySystemCount}</span>{" "}
                    {t(`${th}.withFaults`)} ·{" "}
                    <span className="text-[#c0392b]">{report.codeCount}</span>{" "}
                    {t(`${th}.codesLower`)}
                </p>

                {faultSystems.length === 0 ? (
                    <p
                        className="px-[3cqw] py-[2cqw] text-[#7d8590]"
                        style={{ fontSize: "1.4cqw" }}
                    >
                        {t(`${cs}.scanNoFaults`)}
                    </p>
                ) : (
                    faultSystems.map(([ecuId, dtcs]) => (
                        <div key={ecuId} className="border-t border-[#e3e7ee]">
                            <p
                                className="bg-[#eef3fb] px-[3cqw] py-[1cqw] font-bold text-[#33383f]"
                                style={{ fontSize: "1.45cqw" }}
                            >
                                {report.ecuNames[ecuId] ?? ecuId}
                            </p>
                            {dtcs.map((dtc) => (
                                <div
                                    key={dtc.id}
                                    className="grid items-center border-b border-[#f0d9d9] bg-[#fdeeee]"
                                    style={{
                                        gridTemplateColumns: "14cqw 1fr 12cqw",
                                    }}
                                >
                                    <span
                                        className="px-[1.6cqw] py-[1.1cqw] font-semibold text-[#c0392b]"
                                        style={{ fontSize: "1.35cqw" }}
                                    >
                                        {dtc.code}
                                    </span>
                                    <span
                                        className="py-[1.1cqw] text-[#c96a06]"
                                        style={{ fontSize: "1.35cqw" }}
                                    >
                                        {dtc.desc}
                                    </span>
                                    <span
                                        className="px-[1.2cqw] py-[1.1cqw] text-end"
                                        style={{ fontSize: "1.25cqw" }}
                                    >
                                        {dtc.severity ? (
                                            <span className="rounded-full border border-[#e5c07b] bg-[#fdf3e3] px-[0.9cqw] py-[0.2cqw] font-semibold text-[#b06a00]">
                                                {dtc.severity}
                                            </span>
                                        ) : null}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))
                )}

                <div className="flex justify-end px-[3cqw] py-[2cqw]">
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
                        {t(`${cs}.exit`)}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <span className="text-[#4a4f57]">
            <span className="font-semibold">{label}</span> : {value}
        </span>
    );
}
