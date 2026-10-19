import { render, screen, fireEvent, act } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

const { fetchCatalogMock } = vi.hoisted(() => ({ fetchCatalogMock: vi.fn() }));

vi.mock("@/features/simulator/scanner/data/catalog", () => ({
    fetchCatalog: fetchCatalogMock,
}));

import { ScannerToolHome } from "./ScannerToolHome";
import { SettingsScreen } from "./SettingsScreen";
import { ReportsScreen } from "./ReportsScreen";
import { LiveDataScreen } from "./diagnosis/LiveDataScreen";
import type { EcuNode } from "./diagnosis/systemsData";
import type { ScannerEngine } from "../engine/scanner.engine";
import { markTourDone } from "../lib/scannerProgress";
import { areScannerSoundsMuted, setScannerSoundsMuted } from "../lib/scanSounds";

const FAKE_ECU: EcuNode = {
    id: "ecu-1",
    name: "Engine",
    info: null,
    dtcs: [],
    actuators: [],
    liveData: [
        { id: "rpm", pid: "0C", label: "Engine RPM", unit: "rpm", base: "820" },
        { id: "coolant", pid: "05", label: "Coolant temp", unit: "°C", base: "92.5" },
        { id: "load", pid: "04", label: "Engine load", unit: "%", base: "34" },
    ],
};

function renderHome() {
    return render(
        <I18nextProvider i18n={i18n}>
            <ScannerToolHome />
        </I18nextProvider>,
    );
}

beforeEach(() => {
    fetchCatalogMock.mockReset();
    fetchCatalogMock.mockResolvedValue([]);
    localStorage.clear();
    markTourDone();
    setScannerSoundsMuted(false);
});

describe("scanner boot splash", () => {
    it("shows the splash, then dismisses it after the boot duration", () => {
        vi.useFakeTimers();
        try {
            renderHome();
            expect(screen.getByTestId("scanner-boot")).toBeInTheDocument();
            expect(screen.getByRole("progressbar")).toBeInTheDocument();
            // Step 1: fire the boot timeout so setBooting(false) runs.
            act(() => {
                vi.advanceTimersByTime(1500);
            });
            // Step 2: let the AnimatePresence exit animation finish.
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(screen.queryByTestId("scanner-boot")).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it("keeps the home tiles mounted and clickable underneath the splash", () => {
        vi.useFakeTimers();
        try {
            renderHome();
            // Tiles exist even while the splash is still up.
            fireEvent.click(screen.getByRole("button", { name: "Report" }));
            act(() => {
                vi.advanceTimersByTime(1500);
            });
            expect(screen.getByText("No saved reports yet")).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("LiveDataScreen graph mode", () => {
    function renderLive() {
        return render(
            <I18nextProvider i18n={i18n}>
                <LiveDataScreen
                    ecu={FAKE_ECU}
                    crumbText="Engine"
                    vciConnected
                    onBack={vi.fn()}
                />
            </I18nextProvider>,
        );
    }

    it("starts in list mode and toggles to the graph view", () => {
        renderLive();

        expect(screen.queryByTestId("live-graph")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Graph" }));
        expect(screen.getByTestId("live-graph")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    });

    it("draws one sparkline path per numeric parameter in graph mode", () => {
        vi.useFakeTimers();
        try {
            renderLive();
            fireEvent.click(screen.getByRole("button", { name: "Graph" }));
            // Ticks write history samples; sparklines need at least two.
            act(() => {
                vi.advanceTimersByTime(1600);
            });

            const paths = screen
                .getByTestId("live-graph")
                .querySelectorAll("path[d^='M']");
            expect(paths.length).toBe(FAKE_ECU.liveData.length);
        } finally {
            vi.useRealTimers();
        }
    });

    it("toggles back to the list view", () => {
        renderLive();
        fireEvent.click(screen.getByRole("button", { name: "Graph" }));
        fireEvent.click(screen.getByRole("button", { name: "List" }));
        expect(screen.queryByTestId("live-graph")).toBeNull();
    });
});

describe("SettingsScreen sound toggle", () => {
    const engineMock = {
        getState: () => ({ tick: 3, volts: 13.9 }),
    } as unknown as ScannerEngine;

    function renderSettings() {
        return render(
            <I18nextProvider i18n={i18n}>
                <SettingsScreen engine={engineMock} />
            </I18nextProvider>,
        );
    }

    it("reflects the stored mute pref and flips it on click", () => {
        setScannerSoundsMuted(false);
        renderSettings();

        const toggle = screen.getByTestId("sounds-toggle");
        expect(toggle).toHaveAttribute("aria-checked", "true");
        expect(areScannerSoundsMuted()).toBe(false);

        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute("aria-checked", "false");
        expect(areScannerSoundsMuted()).toBe(true);

        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute("aria-checked", "true");
        expect(areScannerSoundsMuted()).toBe(false);
    });
});

describe("ReportsScreen empty-state CTA", () => {
    it("offers a back-to-the-tablet button that calls onExit", () => {
        const onExit = vi.fn();
        render(
            <I18nextProvider i18n={i18n}>
                <ReportsScreen onExit={onExit} />
            </I18nextProvider>,
        );

        const cta = screen.getByRole("button", { name: "Back to the tablet" });
        fireEvent.click(cta);
        expect(onExit).toHaveBeenCalledTimes(1);
    });
});
