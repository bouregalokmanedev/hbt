import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    CrumbBar,
    ModalShell,
    PANE_BG,
    PaneCard,
    TopBar,
} from "./chrome";
import { LiveDataScreen } from "./LiveDataScreen";
import { markScannerStep } from "../../lib/scannerProgress";
import type { EcuDtc } from "@/features/instructor/data/vehicleSystems";
import type { EcuNode } from "./systemsData";

/* ECU function menu (Read ECU Information / Read DTC / Clear DTC / Live
   Data / Actuator Tests). Used both from the ECU-cards grid and from the
   Automatic Scan screen's per-row Diagnostic button. Read DTC is a full
   screen showing the scan result for this unit — never the instructor's
   raw DTCs. Clear DTC clears the scan faults for this unit. */

type Props = {
    ecu: EcuNode;
    crumbText: string;
    /** Fault codes found for this ECU by the automatic scan (empty = pass). */
    faults: EcuDtc[];
    vciConnected: boolean;
    onBack: () => void;
    /** Clear this ECU's scan faults (wired to the flow's scan result). */
    onClearFaults?: () => void;
};

type MenuAction = "info" | "clearDtc" | "clearDone" | "actuators";

export function EcuMenuScreen({
    ecu,
    crumbText,
    faults,
    vciConnected,
    onBack,
    onClearFaults,
}: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";
    const [modal, setModal] = useState<MenuAction | null>(null);
    const [dtcScreen, setDtcScreen] = useState(false);
    const [liveScreen, setLiveScreen] = useState(false);

    if (liveScreen) {
        return (
            <LiveDataScreen
                ecu={ecu}
                crumbText={`${crumbText} > ${t(`${cs}.readLiveData`)}`}
                vciConnected={vciConnected}
                onBack={() => setLiveScreen(false)}
            />
        );
    }

    if (dtcScreen) {
        return (
            <div className="absolute inset-0 flex flex-col">
                <TopBar
                    onBack={() => setDtcScreen(false)}
                    title={t(`${cs}.readDtc`)}
                    vciConnected={vciConnected}
                />
                <CrumbBar text={crumbText} />
                <div
                    className="min-h-0 flex-1 overflow-y-auto"
                    style={{ background: "#e9ebef" }}
                >
                    {faults.length === 0 ? (
                        <p
                            className="grid h-full place-items-center px-[8cqw] text-center text-[#7d8590]"
                            style={{ fontSize: "1.6cqw" }}
                        >
                            {t(`${cs}.readDtcNoFault`)}
                        </p>
                    ) : (
                        faults.map((dtc, index) => (
                            <div
                                key={dtc.id}
                                className="grid items-center border-b border-[#d5d9df]"
                                style={{
                                    gridTemplateColumns: "13cqw 1fr",
                                    background:
                                        index % 2 === 0 ? "#ffffff" : "#eef1f5",
                                }}
                            >
                                <span
                                    className="px-[1.4cqw] py-[1.5cqw] font-semibold text-[#33383f]"
                                    style={{ fontSize: "1.45cqw" }}
                                >
                                    {dtc.code}
                                </span>
                                <span
                                    className="px-[1.4cqw] py-[1.5cqw] text-[#4a4f57]"
                                    style={{ fontSize: "1.45cqw" }}
                                >
                                    {dtc.desc}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    const close = () => setModal(null);

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onBack} title={ecu.name} vciConnected={vciConnected} />
            <CrumbBar text={crumbText} />

            <div className="relative min-h-0 flex-1" style={{ background: PANE_BG }}>
                <div className="grid grid-cols-4 gap-[1.2cqw] p-[1.6cqw]">
                    <PaneCard
                        label={t(`${cs}.readEcuInfo`)}
                        onClick={() => setModal("info")}
                    />
                    <PaneCard
                        label={t(`${cs}.readDtc`)}
                        onClick={() => {
                            markScannerStep("dtcRead");
                            setDtcScreen(true);
                        }}
                    />
                    <PaneCard
                        label={t(`${cs}.clearDtc`)}
                        onClick={() => setModal("clearDtc")}
                    />
                    <PaneCard
                        label={t(`${cs}.readLiveData`)}
                        onClick={() => {
                            markScannerStep("liveData");
                            setLiveScreen(true);
                        }}
                    />
                    <PaneCard
                        label={t(`${cs}.actuatorTests`)}
                        onClick={() => setModal("actuators")}
                    />
                </div>

                {modal === "info" ? (
                    <ModalShell
                        title={t(`${cs}.readEcuInfo`)}
                        okLabel={t(`${cs}.ok`)}
                        onConfirm={close}
                    >
                        {ecu.info ? (
                            <InfoRows
                                pairs={[
                                    [t(`${cs}.infoSystemName`), ecu.info.systemName || ecu.name],
                                    [
                                        t(`${cs}.infoProgrammingDate`),
                                        ecu.info.programmingDate || "—",
                                    ],
                                    [
                                        t(`${cs}.infoManufactureDate`),
                                        ecu.info.manufactureDate || "—",
                                    ],
                                    ...(ecu.info.supplier
                                        ? [
                                              [t(`${cs}.infoSupplier`), ecu.info.supplier] as [
                                                  string,
                                                  string,
                                              ],
                                          ]
                                        : []),
                                    [t(`${cs}.infoSeriesNumber`), ecu.info.serialNumber || "—"],
                                ]}
                            />
                        ) : (
                            <EmptyNote text={t(`${cs}.noEcuInfo`)} />
                        )}
                    </ModalShell>
                ) : null}

                {modal === "clearDtc" ? (
                    <ModalShell
                        title={t(`${cs}.clearDtcTitle`)}
                        cancelLabel={t(`${cs}.cancel`)}
                        okLabel={t(`${cs}.ok`)}
                        onCancel={close}
                        onConfirm={() => {
                            onClearFaults?.();
                            markScannerStep("dtcCleared");
                            setModal("clearDone");
                        }}
                    >
                        <EmptyNote text={t(`${cs}.clearDtcBody`)} />
                    </ModalShell>
                ) : null}

                {modal === "clearDone" ? (
                    <ModalShell
                        title={t(`${cs}.clearDtcTitle`)}
                        okLabel={t(`${cs}.ok`)}
                        onConfirm={close}
                    >
                        <EmptyNote text={t(`${cs}.clearDtcDone`)} />
                    </ModalShell>
                ) : null}

                {modal === "actuators" ? (
                    <ModalShell
                        title={t(`${cs}.actuatorTests`)}
                        okLabel={t(`${cs}.ok`)}
                        onConfirm={close}
                    >
                        {ecu.actuators.length === 0 ? (
                            <EmptyNote text={t(`${cs}.noActuators`)} />
                        ) : (
                            <div className="max-h-[38cqw] overflow-y-auto">
                                {ecu.actuators.map((actuator) => (
                                    <div
                                        key={actuator.id}
                                        className="border-b border-[#e2e5ea] px-[1.6cqw] py-[1.2cqw] last:border-b-0"
                                    >
                                        <span
                                            className="font-semibold text-[#33383f]"
                                            style={{ fontSize: "1.4cqw" }}
                                        >
                                            {actuator.name}
                                        </span>
                                        {actuator.description ? (
                                            <span
                                                className="mt-[0.3cqw] block text-[#7d8590]"
                                                style={{ fontSize: "1.2cqw" }}
                                            >
                                                {actuator.description}
                                            </span>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ModalShell>
                ) : null}
            </div>
        </div>
    );
}

function InfoRows({ pairs }: { pairs: [string, string][] }) {
    return (
        <div>
            {pairs.map(([label, value], index) => (
                <div
                    key={label}
                    className="grid grid-cols-[1fr_1.1fr] border-b border-[#e2e5ea] last:border-b-0"
                    style={{ background: index % 2 === 0 ? "#f5f6f8" : "#ffffff" }}
                >
                    <span
                        className="px-[1.4cqw] py-[1.3cqw] text-end font-semibold text-[#33383f]"
                        style={{ fontSize: "1.5cqw" }}
                    >
                        {label}
                    </span>
                    <span
                        className="px-[1.4cqw] py-[1.3cqw] text-start font-semibold text-[#2a7be4]"
                        style={{ fontSize: "1.5cqw" }}
                    >
                        {value}
                    </span>
                </div>
            ))}
        </div>
    );
}

function EmptyNote({ text }: { text: string }) {
    return (
        <p
            className="px-[3cqw] py-[2.4cqw] text-center text-[#7d8590]"
            style={{ fontSize: "1.5cqw" }}
        >
            {text}
        </p>
    );
}
