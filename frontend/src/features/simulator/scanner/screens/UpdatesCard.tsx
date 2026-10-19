import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloudDownload, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";

import { TopBar } from "./diagnosis/chrome";
import { SCANNER_DATASET_VERSION } from "../data/scanner.data";
import {
    SCANNER_APP_VERSION,
    SCANNER_LATEST_VERSION,
    isNewerVersion,
} from "../lib/version";

/* Updates card: shows the installed vs latest scanner version and the
   diagnostic dataset on this device, with a check button that reports
   whether an update is available. */

type Props = {
    vciConnected: boolean;
    onExit: () => void;
};

const CARD =
    "rounded-[1.4cqw] border border-[#c9ced6] bg-white p-[2cqw] shadow-[0_0.4cqw_1.2cqw_rgba(30,60,110,.08)]";
const GROUP = "font-bold uppercase tracking-[0.14em] text-[#8a919b]";

export function UpdatesCard({ vciConnected, onExit }: Props) {
    const { t } = useTranslation();
    const uc = "simulator.scannerLab.updatesCard";
    const [status, setStatus] = useState<"idle" | "checking" | "done">("done");
    const timer = useRef<number | undefined>(undefined);

    const updateOut = isNewerVersion(SCANNER_LATEST_VERSION, SCANNER_APP_VERSION);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const check = () => {
        setStatus("checking");
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setStatus("done"), 700);
    };

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onExit} title={t(`${uc}.title`)} vciConnected={vciConnected} />
            <div
                className="min-h-0 flex-1 overflow-y-auto p-[2cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ background: "#e9ebef" }}
            >
                <div className="grid grid-cols-3 gap-[2cqw]">
                    <div className={CARD}>
                        <p className={GROUP} style={{ fontSize: "1.1cqw" }}>
                            {t(`${uc}.installed`)}
                        </p>
                        <div className="mt-[1.4cqw] flex items-center gap-[1.2cqw]">
                            <CloudDownload
                                aria-hidden="true"
                                className="text-[#2f7de1]"
                                style={{ width: "3cqw", height: "3cqw" }}
                            />
                            <p
                                dir="ltr"
                                className="font-mono font-black text-[#1a1d22]"
                                style={{ fontSize: "2.4cqw" }}
                            >
                                v{SCANNER_APP_VERSION}
                            </p>
                        </div>
                        <p
                            className="mt-[1.6cqw] text-[#7d8590]"
                            style={{ fontSize: "1.2cqw" }}
                        >
                            {t(`${uc}.latest`)}:{" "}
                            <span dir="ltr" className="font-mono font-bold">
                                v{SCANNER_LATEST_VERSION}
                            </span>
                        </p>
                        <p
                            className="mt-[0.6cqw] text-[#7d8590]"
                            style={{ fontSize: "1.2cqw" }}
                        >
                            {t(`${uc}.dataset`)}:{" "}
                            <span dir="ltr" className="font-mono font-bold">
                                V{SCANNER_DATASET_VERSION}
                            </span>
                        </p>
                    </div>

                    <div className={`${CARD} col-span-2 flex flex-col justify-between`}>
                        <div>
                            <p className={GROUP} style={{ fontSize: "1.1cqw" }}>
                                {t(`${uc}.status`)}
                            </p>
                            {status === "checking" ? (
                                <div className="mt-[1.6cqw] flex items-center gap-[1cqw] text-[#2f7de1]">
                                    <RefreshCw
                                        aria-hidden="true"
                                        className="animate-spin"
                                        style={{ width: "2.4cqw", height: "2.4cqw" }}
                                    />
                                    <span style={{ fontSize: "1.5cqw", fontWeight: 700 }}>
                                        {t(`${uc}.checking`)}
                                    </span>
                                </div>
                            ) : updateOut ? (
                                <div
                                    className="mt-[1.6cqw] flex items-start gap-[1.2cqw] rounded-[1cqw] border border-[#f0b429]/50 bg-[#fff8e6] p-[1.4cqw]"
                                    data-testid="updates-status"
                                    data-status="available"
                                >
                                    <TriangleAlert
                                        aria-hidden="true"
                                        className="text-[#f0b429]"
                                        style={{ width: "2.6cqw", height: "2.6cqw" }}
                                    />
                                    <div>
                                        <p
                                            className="font-black text-[#8a5b00]"
                                            style={{ fontSize: "1.5cqw" }}
                                        >
                                            {t(`${uc}.updateAvailable`)}
                                        </p>
                                        <p
                                            className="text-[#7d6a44]"
                                            style={{
                                                fontSize: "1.25cqw",
                                                lineHeight: 1.5,
                                                marginTop: "0.4cqw",
                                            }}
                                        >
                                            {t(`${uc}.updateDesc`, {
                                                version: SCANNER_LATEST_VERSION,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="mt-[1.6cqw] flex items-start gap-[1.2cqw] rounded-[1cqw] border border-[#37d67a]/50 bg-[#eefaf2] p-[1.4cqw]"
                                    data-testid="updates-status"
                                    data-status="uptodate"
                                >
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="text-[#22a35a]"
                                        style={{ width: "2.6cqw", height: "2.6cqw" }}
                                    />
                                    <div>
                                        <p
                                            className="font-black text-[#146c3a]"
                                            style={{ fontSize: "1.5cqw" }}
                                        >
                                            {t(`${uc}.upToDate`)}
                                        </p>
                                        <p
                                            className="text-[#4b7a61]"
                                            style={{
                                                fontSize: "1.25cqw",
                                                lineHeight: 1.5,
                                                marginTop: "0.4cqw",
                                            }}
                                        >
                                            {t(`${uc}.upToDateDesc`)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            data-testid="updates-check"
                            disabled={status === "checking"}
                            onClick={check}
                            className="mt-[1.6cqw] w-fit rounded-[0.8cqw] px-[2.4cqw] py-[1.1cqw] font-bold text-white transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-60"
                            style={{
                                fontSize: "1.4cqw",
                                background:
                                    "linear-gradient(180deg, #2a7be0 0%, #1663cc 60%, #0e4fb4 100%)",
                                border: "1px solid #2461bd",
                                boxShadow: "0 0.3cqw 0.8cqw rgba(42,111,212,.35)",
                            }}
                        >
                            {status === "checking"
                                ? t(`${uc}.checking`)
                                : t(`${uc}.check`)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
