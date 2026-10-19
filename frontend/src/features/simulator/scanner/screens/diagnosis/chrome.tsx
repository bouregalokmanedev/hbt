import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, BatteryMedium, MessageSquare, Plug, Unplug } from "lucide-react";
import { useTranslation } from "react-i18next";

/* Shared chrome for the diagnosis screens: top bar (back / title-or-tabs /
   chat+VCI+battery), breadcrumb strip, pane card, modal shell — all sized in
   container-query units against the tablet screen wrapper. */

export const TAB_BAR_BG = "linear-gradient(180deg, #fbfcfd 0%, #eef0f4 100%)";
export const PANE_BG = "linear-gradient(180deg, #eef1f5 0%, #dfe4ea 100%)";
export const CARD_FACE = "linear-gradient(180deg, #fbfcfd 0%, #e8ecf1 100%)";
export const CARD_BORDER = "#b9c0c9";
export const CARD_SHADOW = "0 0.3cqw 0.9cqw rgba(40, 55, 80, 0.16)";
/* Shared card button chrome — every card on every scanner screen uses this. */
export const CARD_BTN =
    "rounded-[0.7cqw] text-center transition duration-150 hover:brightness-[1.03] active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]";
export const BLUE = "#2f7de1";
export const BLUE_GRADIENT = "linear-gradient(180deg, #4a97ec 0%, #2a6fd4 100%)";
export const GREY_GRADIENT = "linear-gradient(180deg, #f6f7f9 0%, #d9dde3 100%)";
export const BUTTON_BORDER = "#b6bcc4";

/* Battery level from the real device battery when the browser exposes it. */
export function useBatteryPercent(): number {
    const [level, setLevel] = useState(84);

    useEffect(() => {
        let alive = true;
        type Battery = {
            level: number;
            addEventListener(type: string, listener: () => void): void;
        };
        const nav = navigator as Navigator & {
            getBattery?: () => Promise<Battery>;
        };
        if (typeof nav.getBattery === "function") {
            nav.getBattery()
                .then((battery) => {
                    if (!alive) return;
                    const update = () => setLevel(Math.round(battery.level * 100));
                    update();
                    battery.addEventListener("levelchange", update);
                })
                .catch(() => undefined);
        }
        return () => {
            alive = false;
        };
    }, []);

    return level;
}

type TopBarProps = {
    onBack: () => void;
    title?: string;
    left?: ReactNode;
    center?: ReactNode;
    search?: ReactNode;
    right?: ReactNode;
    vciConnected?: boolean;
};

export function TopBar({
    onBack,
    title,
    left,
    center,
    search,
    right,
    vciConnected,
}: TopBarProps) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";
    const battery = useBatteryPercent();

    return (
        <div
            className="relative flex h-[9.5%] shrink-0 items-center gap-[1cqw] px-[1.4cqw]"
            style={{ background: TAB_BAR_BG, borderBottom: "1px solid #c3c8cf" }}
        >
            <button
                type="button"
                aria-label={t(`${cs}.back`)}
                onClick={onBack}
                className="grid aspect-[1.6/1] h-[68%] place-items-center rounded-[0.8cqw] text-[#5a616b] transition hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                style={{ background: GREY_GRADIENT, border: `1px solid ${BUTTON_BORDER}` }}
            >
                <ArrowLeft
                    className="rtl:-scale-x-100"
                    style={{ width: "2.6cqw", height: "2.6cqw" }}
                />
            </button>

            {left}

            <div className="absolute left-1/2 flex -translate-x-1/2 items-center">
                {center ?? (
                    <span
                        className="font-semibold whitespace-nowrap text-[#4a4f57]"
                        style={{ fontSize: "2.4cqw" }}
                    >
                        {title}
                    </span>
                )}
            </div>

            <div className="ms-auto flex items-center gap-[1.2cqw]">
                {search}
                {right ?? (
                    <>
                        <TopIcon label={t(`${cs}.chat`)}>
                            <MessageSquare
                                style={{ width: "2.2cqw", height: "2.2cqw" }}
                                className="text-[#7d8590]"
                            />
                        </TopIcon>
                        <TopIcon label={t(`${cs}.vci`)}>
                            {vciConnected ? (
                                <Plug style={{ width: "2.3cqw", height: "2.3cqw" }} className="text-[#2f7de1]" />
                            ) : (
                                <Unplug style={{ width: "2.3cqw", height: "2.3cqw" }} className="text-[#7d8590]" />
                            )}
                        </TopIcon>
                        <div className="flex items-center gap-[0.5cqw] text-[#2f7de1]">
                            <BatteryMedium style={{ width: "2.6cqw", height: "2.6cqw" }} />
                            <span className="font-bold" style={{ fontSize: "1.3cqw" }}>
                                {battery}%
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function TopIcon({ label, children }: { label: string; children: ReactNode }) {
    return (
        <span
            role="img"
            aria-label={label}
            title={label}
            className="grid place-items-center"
        >
            {children}
        </span>
    );
}

export function CrumbBar({ text }: { text: string }) {
    return (
        <div
            className="flex h-[5.5%] shrink-0 items-center px-[1.6cqw]"
            style={{
                background: "linear-gradient(180deg, #f2f4f7 0%, #e7eaee 100%)",
                borderBottom: "1px solid #ccd1d8",
            }}
        >
            <span className="text-[#565c66]" style={{ fontSize: "1.45cqw" }}>
                {text}
            </span>
        </div>
    );
}

/* White menu/detection card on the grey pane (reference layout: 4-column
   grid, soft shadow, centered label). */
export function PaneCard({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center px-[1.2cqw] ${CARD_BTN}`}
            style={{
                background: CARD_FACE,
                border: `1px solid ${CARD_BORDER}`,
                boxShadow: CARD_SHADOW,
                aspectRatio: "306 / 179",
            }}
        >
            <span
                className="font-semibold text-[#33383f]"
                style={{ fontSize: "2.15cqw", lineHeight: 1.25 }}
            >
                {label}
            </span>
        </button>
    );
}

type ModalShellProps = {
    title: string;
    subtitle?: string;
    children: ReactNode;
    cancelLabel?: string;
    okLabel?: string;
    okDisabled?: boolean;
    onCancel?: () => void;
    onConfirm?: () => void;
    /** "solid" fully hides the screen behind (blocking gates). */
    overlay?: "dim" | "solid";
};

export function ModalShell({
    title,
    subtitle,
    children,
    cancelLabel,
    okLabel,
    okDisabled = false,
    onCancel,
    onConfirm,
    overlay = "dim",
}: ModalShellProps) {
    const showCancel = Boolean(cancelLabel && onCancel);
    return (
        <div
            className="absolute inset-0 z-20 grid place-items-center"
            style={{
                background:
                    overlay === "solid"
                        ? "#101318"
                        : "rgba(44, 50, 60, 0.55)",
            }}
        >
            <div
                className="w-[74%] overflow-hidden rounded-[1.2cqw]"
                style={{ boxShadow: "0 2cqw 5cqw rgba(10, 20, 40, 0.45)" }}
            >
                <div
                    className="py-[1.7cqw] text-center"
                    style={{
                        background: "linear-gradient(180deg, #f0f2f5 0%, #e2e5ea 100%)",
                        borderBottom: "1px solid #c9ced6",
                    }}
                >
                    <span
                        className="font-semibold text-[#4a4f57]"
                        style={{ fontSize: "2.3cqw" }}
                    >
                        {title}
                    </span>
                    {subtitle ? (
                        <span
                            className="mt-[0.4cqw] block font-medium text-[#7d8590]"
                            style={{ fontSize: "1.45cqw" }}
                        >
                            {subtitle}
                        </span>
                    ) : null}
                </div>

                <div style={{ background: "#ffffff" }}>{children}</div>

                <div
                    className="flex gap-[8%] px-[6%] py-[2cqw]"
                    style={{ background: "#ffffff" }}
                >
                    {showCancel ? (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 rounded-[0.7cqw] py-[1.4cqw] font-semibold text-[#4a4f57] transition hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                            style={{ background: GREY_GRADIENT, border: `1px solid ${BUTTON_BORDER}` }}
                        >
                            {cancelLabel}
                        </button>
                    ) : null}
                    {okLabel && onConfirm ? (
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={okDisabled}
                            className={`${showCancel ? "flex-1" : "w-full"} rounded-[0.7cqw] py-[1.4cqw] font-bold text-white transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                                okDisabled ? "cursor-not-allowed opacity-50" : ""
                            }`}
                            style={{
                                background: BLUE_GRADIENT,
                                border: "1px solid #2461bd",
                                boxShadow: "0 0.3cqw 0.7cqw rgba(42, 111, 212, 0.4)",
                            }}
                        >
                            {okLabel}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

/* OBD gate popup used across the scanner tablet:
   - "connect": shown when a locked tool (Diagnosis / Special Function) is
     tapped without the OBD link plugged in — single OK to dismiss.
   - "check": shown when the student picks a vehicle — a reminder to verify
     the OBD connection; Continue is disabled while the link is unplugged. */
export function ObdGateModal({
    mode,
    vciConnected = false,
    onCancel,
    onConfirm,
}: {
    mode: "connect" | "check" | "block";
    vciConnected?: boolean;
    onCancel?: () => void;
    onConfirm?: () => void;
}) {
    const { t } = useTranslation();
    const og = "simulator.scannerLab.obdGate";

    /* Blocking gate: the screen behind is fully covered and OK stays
       disabled until the connector is plugged back in. */
    if (mode === "block") {
        return (
            <ModalShell
                overlay="solid"
                title={t(`${og}.connectTitle`)}
                okLabel={t(`${og}.ok`)}
                onConfirm={onConfirm}
                okDisabled={!vciConnected}
            >
                <div className="flex flex-col items-center gap-[1.4cqw] px-[4cqw] py-[2.6cqw]">
                    {vciConnected ? (
                        <Plug
                            style={{ width: "7cqw", height: "7cqw" }}
                            className="text-[#2f7de1]"
                            aria-hidden="true"
                        />
                    ) : (
                        <Unplug
                            style={{ width: "7cqw", height: "7cqw" }}
                            className="text-[#c0392b]"
                            aria-hidden="true"
                        />
                    )}
                    <p
                        className="text-center text-[#4a4f57]"
                        style={{ fontSize: "1.6cqw" }}
                    >
                        {vciConnected ? t(`${og}.blockReady`) : t(`${og}.blockBody`)}
                    </p>
                </div>
            </ModalShell>
        );
    }

    if (mode === "connect") {
        return (
            <ModalShell
                title={t(`${og}.connectTitle`)}
                cancelLabel={t(`${og}.ok`)}
                onCancel={onCancel}
            >
                <div className="flex flex-col items-center gap-[1.4cqw] px-[4cqw] py-[2.6cqw]">
                    <Unplug
                        style={{ width: "7cqw", height: "7cqw" }}
                        className="text-[#c0392b]"
                        aria-hidden="true"
                    />
                    <p
                        className="text-center text-[#4a4f57]"
                        style={{ fontSize: "1.6cqw" }}
                    >
                        {t(`${og}.connectBody`)}
                    </p>
                </div>
            </ModalShell>
        );
    }

    return (
        <ModalShell
            title={t(`${og}.checkTitle`)}
            cancelLabel={t(`${og}.cancel`)}
            okLabel={t(`${og}.continue`)}
            onCancel={onCancel}
            onConfirm={onConfirm}
            okDisabled={!vciConnected}
        >
            <div className="flex flex-col items-center gap-[1.4cqw] px-[4cqw] py-[2.6cqw]">
                {vciConnected ? (
                    <Plug
                        style={{ width: "7cqw", height: "7cqw" }}
                        className="text-[#2f7de1]"
                        aria-hidden="true"
                    />
                ) : (
                    <Unplug
                        style={{ width: "7cqw", height: "7cqw" }}
                        className="text-[#7d8590]"
                        aria-hidden="true"
                    />
                )}
                <p
                    className="text-center text-[#4a4f57]"
                    style={{ fontSize: "1.6cqw" }}
                >
                    {t(`${og}.checkBody`)}
                </p>
                {/* Status message only while unplugged — no "OBD is
                    connected" line when the link is seated. */}
                {vciConnected ? null : (
                    <p
                        className="text-center text-[#c0392b]"
                        style={{ fontSize: "1.4cqw" }}
                    >
                        {t(`${og}.notConnected`)}
                    </p>
                )}
            </div>
        </ModalShell>
    );
}
