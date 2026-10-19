import { beforeEach, describe, expect, it } from "vitest";

import {
    displayPid,
    getScanSpeed,
    getScannerMotion,
    getScannerUnits,
    scanRevealMs,
    setScanSpeed,
    setScannerMotion,
    setScannerUnits,
} from "./scannerSettings";
import {
    getScannerSoundsVolume,
    setScannerSoundsVolume,
} from "./scanSounds";

const METRIC = { temp: "c", press: "bar", speed: "kmh" } as const;

beforeEach(() => {
    localStorage.clear();
});

describe("scannerSettings", () => {
    it("defaults to metric units, normal cadence and full motion", () => {
        expect(getScannerUnits()).toEqual(METRIC);
        expect(getScanSpeed()).toBe("normal");
        expect(getScannerMotion()).toBe("full");
        expect(scanRevealMs()).toBe(400);
        expect(getScannerSoundsVolume()).toBe(1);
    });

    it("stores each preference as it changes", () => {
        setScannerUnits({ temp: "f" });
        setScanSpeed("slow");
        setScannerMotion("reduced");
        setScannerSoundsVolume(0.4);
        expect(getScannerUnits()).toEqual({ ...METRIC, temp: "f" });
        expect(getScanSpeed()).toBe("slow");
        expect(getScannerMotion()).toBe("reduced");
        expect(getScannerSoundsVolume()).toBe(0.4);
        expect(scanRevealMs()).toBe(700);
        setScanSpeed("fast");
        expect(scanRevealMs()).toBe(200);
    });

    it("converts live-data samples into the chosen units", () => {
        setScannerUnits({ temp: "f", press: "psi", speed: "mph" });
        const units = getScannerUnits();
        expect(displayPid("89", "°C", units)).toEqual({ value: "192.2", unit: "°F" });
        expect(displayPid("210", "kPa", units)).toEqual({ value: "30.5", unit: "psi" });
        expect(displayPid("11.2", "MPa", units)).toEqual({ value: "1624.4", unit: "psi" });
        expect(displayPid("100", "km/h", units)).toEqual({ value: "62.1", unit: "mph" });
        expect(displayPid("4", "bar", units)).toEqual({ value: "58.0", unit: "psi" });
    });

    it("leaves matching units and text values untouched", () => {
        const units = getScannerUnits();
        expect(displayPid("92.5", "°C", units)).toEqual({ value: "92.5", unit: "°C" });
        expect(displayPid("13.9", "V", units)).toEqual({ value: "13.9", unit: "V" });
        expect(displayPid("2479.75", "1/min", units)).toEqual({ value: "2479.75", unit: "1/min" });
        expect(displayPid("210", "kPa", units)).toEqual({ value: "2.1", unit: "bar" });
        expect(displayPid("N/A", "°C", units)).toEqual({ value: "N/A", unit: "°C" });
    });

    it("falls back to defaults when storage is corrupt", () => {
        localStorage.setItem("hbt:scanner-units", "{oops");
        localStorage.setItem("hbt:scanner-scan-speed", "turbo");
        localStorage.setItem("hbt:scanner-motion", "dizzy");
        localStorage.setItem("hbt:scanner-sound-volume", "loud");
        expect(getScannerUnits()).toEqual(METRIC);
        expect(getScanSpeed()).toBe("normal");
        expect(getScannerMotion()).toBe("full");
        expect(getScannerSoundsVolume()).toBe(1);
    });
});
