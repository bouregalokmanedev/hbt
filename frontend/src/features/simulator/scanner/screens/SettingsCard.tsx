import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { changeLanguage, type SupportedLocale } from "@/i18n";
import { TopBar } from "./diagnosis/chrome";
import {
    areScannerSoundsMuted,
    getScannerSoundsVolume,
    setScannerSoundsMuted,
    setScannerSoundsVolume,
} from "../lib/scanSounds";
import {
    getScanSpeed,
    getScannerMotion,
    getScannerUnits,
    setScanSpeed,
    setScannerMotion,
    setScannerUnits,
    type MotionPref,
    type PressUnit,
    type ScanSpeed,
    type ScannerUnits,
    type SpeedUnit,
    type TempUnit,
} from "../lib/scannerSettings";

/* Student settings card shown when the Setting tile is tapped: display
   brightness, sound + volume, measurement units, language, scan speed and
   a tour replay — the handful of tablet settings that actually change the
   lab experience. Each choice persists immediately. */

type Props = {
    vciConnected: boolean;
    brightness: number;
    onBrightnessChange: (value: number) => void;
    onExit: () => void;
    onReplayTour: () => void;
};

const CARD =
    "rounded-[1.4cqw] border border-[#c9ced6] bg-white p-[2cqw] shadow-[0_0.4cqw_1.2cqw_rgba(30,60,110,.08)]";
const GROUP =
    "font-bold uppercase tracking-[0.14em] text-[#8a919b]";
const LABEL = "text-[#4a4f57] font-semibold";
const ROW =
    "mt-[1.6cqw] flex items-center justify-between gap-[1cqw]";

type SegOption<T extends string> = {
    value: T;
    label: string;
    testid: string;
};

function Seg<T extends string>({
    value,
    options,
    onChange,
    label,
}: {
    value: T;
    options: SegOption<T>[];
    onChange: (value: T) => void;
    label: string;
}) {
    return (
        <span
            role="group"
            aria-label={label}
            className="flex shrink-0 overflow-hidden rounded-[0.6cqw] border border-[#c9ced6]"
            style={{ fontSize: "1.25cqw" }}
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    data-testid={option.testid}
                    onClick={() => onChange(option.value)}
                    className={`px-[1cqw] py-[0.5cqw] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1] focus-visible:outline-offset-[-2px] ${
                        value === option.value
                            ? "bg-[#2f7de1] text-white"
                            : "text-[#4a4f57] hover:bg-[#eef2f8]"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </span>
    );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className={ROW} style={{ fontSize: "1.5cqw" }}>
            <span className={LABEL}>{label}</span>
            {children}
        </div>
    );
}

function ToggleSwitch({
    checked,
    testid,
    label,
    onToggle,
}: {
    checked: boolean;
    testid: string;
    label: string;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            data-testid={testid}
            onClick={onToggle}
            className={`relative h-[2.2cqw] w-[4.4cqw] rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1] ${
                checked ? "bg-[#2f7de1]" : "bg-[#c3c8cf]"
            }`}
        >
            <span
                className="absolute top-1/2 h-[1.7cqw] w-[1.7cqw] -translate-y-1/2 rounded-full bg-white shadow transition-all"
                style={{ insetInlineStart: checked ? "2.4cqw" : "0.25cqw" }}
            />
        </button>
    );
}

export function SettingsCard({
    vciConnected,
    brightness,
    onBrightnessChange,
    onExit,
    onReplayTour,
}: Props) {
    const { t, i18n } = useTranslation();
    const sc = "simulator.scannerLab.settingsCard";
    const [muted, setMuted] = useState(() => areScannerSoundsMuted());
    const [volume, setVolume] = useState(() => getScannerSoundsVolume());
    const [units, setUnits] = useState<ScannerUnits>(() => getScannerUnits());
    const [speed, setSpeed] = useState<ScanSpeed>(() => getScanSpeed());
    const [motion, setMotion] = useState<MotionPref>(() => getScannerMotion());
    const lang: SupportedLocale = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar")
        ? "ar"
        : "en";

    const commitUnits = (patch: Partial<ScannerUnits>) => {
        setScannerUnits(patch);
        setUnits(getScannerUnits());
    };

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar onBack={onExit} title={t(`${sc}.title`)} vciConnected={vciConnected} />
            <div
                className="min-h-0 flex-1 overflow-y-auto p-[2cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ background: "#e9ebef" }}
            >
                <div className="grid grid-cols-3 gap-[2cqw]">
                    {/* display */}
                    <div className={CARD}>
                        <p className={GROUP} style={{ fontSize: "1.1cqw" }}>
                            {t(`${sc}.display`)}
                        </p>
                        <label
                            className="mt-[1.6cqw] flex items-center justify-between gap-[1cqw]"
                            style={{ fontSize: "1.5cqw" }}
                        >
                            <span className={LABEL}>{t(`${sc}.brightness`)}</span>
                            <span
                                dir="ltr"
                                className="font-mono font-bold text-[#2f7de1]"
                                style={{ fontSize: "1.3cqw" }}
                            >
                                {Math.round(brightness * 100)}%
                            </span>
                        </label>
                        <input
                            type="range"
                            min={0.7}
                            max={1.3}
                            step={0.05}
                            value={brightness}
                            data-testid="settings-brightness"
                            aria-label={t(`${sc}.brightness`)}
                            onChange={(e) => onBrightnessChange(Number(e.target.value))}
                            className="mt-[1.2cqw] w-full accent-[#F47822]"
                        />
                    </div>

                    {/* sound */}
                    <div className={CARD}>
                        <p className={GROUP} style={{ fontSize: "1.1cqw" }}>
                            {t(`${sc}.sound`)}
                        </p>
                        <Row label={t(`${sc}.sounds`)}>
                            <ToggleSwitch
                                checked={!muted}
                                testid="settings-sounds-toggle"
                                label={t(`${sc}.sounds`)}
                                onToggle={() => {
                                    const next = !muted;
                                    setMuted(next);
                                    setScannerSoundsMuted(next);
                                }}
                            />
                        </Row>
                        <Row label={t(`${sc}.volume`)}>
                            <span
                                dir="ltr"
                                className="font-mono font-bold text-[#2f7de1]"
                                style={{ fontSize: "1.3cqw" }}
                            >
                                {Math.round(volume * 100)}%
                            </span>
                        </Row>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={Math.round(volume * 100)}
                            data-testid="settings-volume"
                            aria-label={t(`${sc}.volume`)}
                            onChange={(e) => {
                                const next = Number(e.target.value) / 100;
                                setVolume(next);
                                setScannerSoundsVolume(next);
                            }}
                            className="mt-[1.2cqw] w-full accent-[#F47822]"
                        />
                    </div>

                    {/* guide */}
                    <div className={CARD}>
                        <p className={GROUP} style={{ fontSize: "1.1cqw" }}>
                            {t(`${sc}.guide`)}
                        </p>
                        <p
                            className="mt-[1.2cqw] text-[#7d8590]"
                            style={{ fontSize: "1.25cqw", lineHeight: 1.5 }}
                        >
                            {t(`${sc}.replayTourHint`)}
                        </p>
                        <button
                            type="button"
                            data-testid="settings-replay-tour"
                            onClick={onReplayTour}
                            className="mt-[1.4cqw] w-full rounded-[0.8cqw] py-[1.1cqw] font-bold text-white transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                            style={{
                                fontSize: "1.4cqw",
                                background:
                                    "linear-gradient(180deg, #2a7be0 0%, #1663cc 60%, #0e4fb4 100%)",
                                border: "1px solid #2461bd",
                                boxShadow: "0 0.3cqw 0.8cqw rgba(42,111,212,.35)",
                            }}
                        >
                            {t(`${sc}.replayTour`)}
                        </button>
                    </div>

                    {/* units */}
                    <div className={CARD}>
                        <p className={GROUP} style={{ fontSize: "1.1cqw" }}>
                            {t(`${sc}.units`)}
                        </p>
                        <Row label={t(`${sc}.temperature`)}>
                            <Seg<TempUnit>
                                label={t(`${sc}.temperature`)}
                                value={units.temp}
                                onChange={(temp) => commitUnits({ temp })}
                                options={[
                                    { value: "c", label: "°C", testid: "settings-unit-temp-c" },
                                    { value: "f", label: "°F", testid: "settings-unit-temp-f" },
                                ]}
                            />
                        </Row>
                        <Row label={t(`${sc}.pressure`)}>
                            <Seg<PressUnit>
                                label={t(`${sc}.pressure`)}
                                value={units.press}
                                onChange={(press) => commitUnits({ press })}
                                options={[
                                    { value: "bar", label: "bar", testid: "settings-unit-press-bar" },
                                    { value: "psi", label: "psi", testid: "settings-unit-press-psi" },
                                ]}
                            />
                        </Row>
                        <Row label={t(`${sc}.speed`)}>
                            <Seg<SpeedUnit>
                                label={t(`${sc}.speed`)}
                                value={units.speed}
                                onChange={(speedUnit) => commitUnits({ speed: speedUnit })}
                                options={[
                                    { value: "kmh", label: "km/h", testid: "settings-unit-speed-kmh" },
                                    { value: "mph", label: "mph", testid: "settings-unit-speed-mph" },
                                ]}
                            />
                        </Row>
                    </div>

                    {/* language */}
                    <div className={CARD}>
                        <p className={GROUP} style={{ fontSize: "1.1cqw" }}>
                            {t(`${sc}.language`)}
                        </p>
                        <div className="mt-[1.6cqw]">
                            <Seg<SupportedLocale>
                                label={t(`${sc}.language`)}
                                value={lang}
                                onChange={(next) => changeLanguage(next)}
                                options={[
                                    { value: "en", label: "English", testid: "settings-language-en" },
                                    { value: "ar", label: "العربية", testid: "settings-language-ar" },
                                ]}
                            />
                        </div>
                    </div>

                    {/* scan speed */}
                    <div className={CARD}>
                        <p className={GROUP} style={{ fontSize: "1.1cqw" }}>
                            {t(`${sc}.scanSpeed`)}
                        </p>
                        <div className="mt-[1.6cqw]">
                            <Seg<ScanSpeed>
                                label={t(`${sc}.scanSpeed`)}
                                value={speed}
                                onChange={(next) => {
                                    setScanSpeed(next);
                                    setSpeed(next);
                                }}
                                options={[
                                    { value: "slow", label: t(`${sc}.slow`), testid: "settings-scan-speed-slow" },
                                    { value: "normal", label: t(`${sc}.normal`), testid: "settings-scan-speed-normal" },
                                    { value: "fast", label: t(`${sc}.fast`), testid: "settings-scan-speed-fast" },
                                ]}
                            />
                        </div>
                        <Row label={t(`${sc}.animations`)}>
                            <ToggleSwitch
                                checked={motion === "full"}
                                testid="settings-motion-toggle"
                                label={t(`${sc}.animations`)}
                                onToggle={() => {
                                    const next: MotionPref = motion === "full" ? "reduced" : "full";
                                    setMotion(next);
                                    setScannerMotion(next);
                                }}
                            />
                        </Row>
                    </div>
                </div>
            </div>
        </div>
    );
}
