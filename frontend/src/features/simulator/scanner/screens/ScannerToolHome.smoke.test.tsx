import { render, screen, fireEvent, act } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n, { changeLanguage } from "@/i18n";

const { fetchCatalogMock } = vi.hoisted(() => ({ fetchCatalogMock: vi.fn() }));

vi.mock("@/features/simulator/scanner/data/catalog", () => ({
    fetchCatalog: fetchCatalogMock,
}));

import { ScannerToolHome, type ScannerToolAction } from "./ScannerToolHome";
import { specialFunctionsStore } from "@/features/instructor/data/specialFunctionsStore";
import { markTourDone, resetScannerSteps } from "../lib/scannerProgress";

function renderHome(onSelect?: (action: ScannerToolAction) => void) {
    return render(
        <I18nextProvider i18n={i18n}>
            <ScannerToolHome onSelect={onSelect} />
        </I18nextProvider>,
    );
}

/** Plug the OBD connector via the link tool (900 ms animation). */
function plugObd() {
    vi.useFakeTimers();
    try {
        fireEvent.click(
            screen.getByRole("button", {
                name: "Plug the OBD connector into the vehicle port",
            }),
        );
        act(() => {
            vi.advanceTimersByTime(900);
        });
    } finally {
        vi.useRealTimers();
    }
}

/** Unplug the OBD connector via the link tool (500 ms animation). */
function unplugObd() {
    vi.useFakeTimers();
    try {
        fireEvent.click(
            screen.getByRole("button", {
                name: "Unplug the OBD connector from the vehicle port",
            }),
        );
        act(() => {
            vi.advanceTimersByTime(500);
        });
    } finally {
        vi.useRealTimers();
    }
}

beforeEach(() => {
    fetchCatalogMock.mockReset();
    fetchCatalogMock.mockResolvedValue([]);
    localStorage.clear();
    specialFunctionsStore.reset();
    // The first-use tour auto-opens when unset — keep existing flows direct.
    markTourDone();
    resetScannerSteps();
});

describe("ScannerToolHome", () => {
    it("renders the navbar brand logo and all four tiles", () => {
        renderHome();

        expect(screen.getByAltText("HBTronics")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Special Function" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Report" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Diagnosis" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Updates" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Setting" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "AUTO SCAN" })).toBeNull();
        expect(screen.queryByRole("button", { name: "ECU Diagnostics" })).toBeNull();
    });

    it("shows the diagnosis subtitle", () => {
        renderHome();
        expect(screen.getByText("Vehicle system analysis")).toBeInTheDocument();
    });

    it("reports the tapped tile through onSelect", () => {
        const onSelect = vi.fn();
        renderHome(onSelect);

        // Updates and Setting now open their own screens — go back after each.
        fireEvent.click(screen.getByRole("button", { name: "Updates" }));
        expect(onSelect).toHaveBeenLastCalledWith("updates");
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        fireEvent.click(screen.getByRole("button", { name: "Setting" }));
        expect(onSelect).toHaveBeenLastCalledWith("setting");
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        fireEvent.click(screen.getByRole("button", { name: "Special Function" }));
        expect(onSelect).toHaveBeenLastCalledWith("special");
        fireEvent.click(screen.getByRole("button", { name: "OK" }));

        // Report also opens the saved-reports view (last so the home stays).
        fireEvent.click(screen.getByRole("button", { name: "Report" }));
        expect(onSelect.mock.calls.map(([a]) => a)).toEqual([
            "updates",
            "setting",
            "special",
            "report",
        ]);
    });

    it("opens the saved-reports screen from the Report tile", () => {
        renderHome();

        fireEvent.click(screen.getByRole("button", { name: "Report" }));
        expect(screen.getByText("No saved reports yet")).toBeInTheDocument();
    });

    it("opens the settings card and applies brightness, sounds and tour replay", () => {
        renderHome();

        fireEvent.click(screen.getByRole("button", { name: "Setting" }));
        expect(screen.getByText("Settings")).toBeInTheDocument();

        const slider = screen.getByTestId("settings-brightness");
        expect(slider).toHaveValue("1");
        fireEvent.change(slider, { target: { value: "1.2" } });
        expect(localStorage.getItem("hbt:scanner-brightness")).toBe("1.2");
        const screenEl = document.querySelector("[data-device-screen]");
        expect(screenEl?.getAttribute("style")).toContain("brightness(1.2)");

        const sounds = screen.getByTestId("settings-sounds-toggle");
        expect(sounds).toHaveAttribute("aria-checked", "true");
        fireEvent.click(sounds);
        expect(sounds).toHaveAttribute("aria-checked", "false");
        expect(localStorage.getItem("hbt:scanner-sounds-muted")).toBe("1");

        fireEvent.click(screen.getByTestId("settings-replay-tour"));
        expect(screen.getByText("Your diagnostic tablet")).toBeInTheDocument();
    });

    it("persists units, volume, scan speed, motion and language", async () => {
        renderHome();

        fireEvent.click(screen.getByRole("button", { name: "Setting" }));

        fireEvent.click(screen.getByTestId("settings-unit-temp-f"));
        fireEvent.click(screen.getByTestId("settings-unit-press-psi"));
        fireEvent.click(screen.getByTestId("settings-unit-speed-mph"));
        expect(JSON.parse(localStorage.getItem("hbt:scanner-units") ?? "{}")).toEqual({
            temp: "f",
            press: "psi",
            speed: "mph",
        });
        expect(screen.getByTestId("settings-unit-temp-f")).toHaveAttribute("aria-pressed", "true");

        fireEvent.change(screen.getByTestId("settings-volume"), { target: { value: "40" } });
        expect(localStorage.getItem("hbt:scanner-sound-volume")).toBe("0.4");

        fireEvent.click(screen.getByTestId("settings-scan-speed-slow"));
        expect(localStorage.getItem("hbt:scanner-scan-speed")).toBe("slow");

        const motion = screen.getByTestId("settings-motion-toggle");
        expect(motion).toHaveAttribute("aria-checked", "true");
        fireEvent.click(motion);
        expect(motion).toHaveAttribute("aria-checked", "false");
        expect(localStorage.getItem("hbt:scanner-motion")).toBe("reduced");

        fireEvent.click(screen.getByTestId("settings-language-ar"));
        expect(localStorage.getItem("hbt-language")).toBe("ar");
        try {
            await vi.waitFor(() => expect(document.documentElement.dir).toBe("rtl"));
            expect(await screen.findByText("الإعدادات")).toBeInTheDocument();
            expect(screen.getByTestId("settings-language-ar")).toHaveAttribute("aria-pressed", "true");
        } finally {
            changeLanguage("en");
            await vi.waitFor(() => expect(document.documentElement.dir).toBe("ltr"));
        }
    });

    it("opens the updates card with version status and re-checks for updates", async () => {
        renderHome();

        fireEvent.click(screen.getByRole("button", { name: "Updates" }));
        expect(screen.getByText("Installed version")).toBeInTheDocument();
        expect(screen.getAllByText("v1.4.0")).toHaveLength(2);
        expect(screen.getByText("V2026.7")).toBeInTheDocument();
        expect(screen.getByTestId("updates-status")).toHaveAttribute(
            "data-status",
            "uptodate",
        );

        fireEvent.click(screen.getByTestId("updates-check"));
        expect(screen.getByRole("button", { name: "Checking…" })).toBeDisabled();
        expect(await screen.findByTestId("updates-status")).toHaveAttribute(
            "data-status",
            "uptodate",
        );
    });

    it("opens the special functions screen when the Special Function tile is tapped", () => {
        const onSelect = vi.fn();
        renderHome(onSelect);
        plugObd();

        fireEvent.click(screen.getByRole("button", { name: "Special Function" }));
        expect(onSelect).toHaveBeenCalledWith("special");
        expect(screen.getByText("No special functions yet")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Report" })).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByRole("button", { name: "Report" })).toBeInTheDocument();
    });

    it("locks Diagnosis and Special Function until the OBD is connected", async () => {
        renderHome();

        fireEvent.click(screen.getByRole("button", { name: "Diagnosis" }));
        expect(screen.getByText("OBD not connected")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        expect(screen.queryByText("OBD not connected")).toBeNull();
        expect(screen.getByRole("button", { name: "Diagnosis" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Special Function" }));
        expect(screen.getByText("OBD not connected")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "OK" }));

        plugObd();
        fireEvent.click(screen.getByRole("button", { name: "Diagnosis" }));
        expect(
            await screen.findByRole("button", { name: /Diagnosis for OBD II/ }),
        ).toBeInTheDocument();
    });

    it("opens the diagnosis flow when the Diagnosis tile is tapped", async () => {
        const onSelect = vi.fn();
        renderHome(onSelect);
        plugObd();

        fireEvent.click(screen.getByRole("button", { name: "Diagnosis" }));
        expect(onSelect).toHaveBeenCalledWith("diagnosis");

        expect(
            await screen.findByRole("button", { name: /Diagnosis for OBD II/ }),
        ).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Special Function" })).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByRole("button", { name: "Special Function" })).toBeInTheDocument();
    });

    it("blocks the diagnosis when the OBD link is unplugged mid-scan", async () => {
        renderHome();
        plugObd();

        fireEvent.click(screen.getByRole("button", { name: "Diagnosis" }));
        expect(
            await screen.findByRole("button", { name: /Diagnosis for OBD II/ }),
        ).toBeInTheDocument();

        // Unplug while inside the diagnosis flow.
        vi.useFakeTimers();
        try {
            fireEvent.click(
                screen.getByRole("button", {
                    name: "Unplug the OBD connector from the vehicle port",
                }),
            );
            act(() => {
                vi.advanceTimersByTime(500);
            });
        } finally {
            vi.useRealTimers();
        }

        // The blocking gate covers the screen and OK stays disabled until
        // the connector is plugged back in.
        expect(screen.getByText("OBD not connected")).toBeInTheDocument();
        expect(
            screen.getByText(/unplugged during the diagnosis/i),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();

        plugObd();
        expect(screen.getByRole("button", { name: "OK" })).toBeEnabled();
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        expect(screen.queryByText("OBD not connected")).toBeNull();
        expect(
            screen.getByRole("button", { name: /Diagnosis for OBD II/ }),
        ).toBeInTheDocument();
    });

    it("keeps Settings and Updates unlocked after the link is unplugged", () => {
        renderHome();
        plugObd();
        unplugObd();

        // Watchdog may arm on the home view — no modal at rest.
        expect(screen.queryByText("OBD not connected")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Setting" }));
        expect(screen.getByText("Settings")).toBeInTheDocument();
        expect(screen.queryByText("OBD not connected")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        fireEvent.click(screen.getByRole("button", { name: "Updates" }));
        expect(screen.getByText("Installed version")).toBeInTheDocument();
        expect(screen.queryByText("OBD not connected")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        // Control: while still unplugged, the locked views keep their gate.
        fireEvent.click(screen.getByRole("button", { name: "Diagnosis" }));
        expect(screen.getByText("OBD not connected")).toBeInTheDocument();
    });

    it("renders the OBD link tool beside the device", () => {
        renderHome();

        expect(screen.getByText("OBD Link")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Plug the OBD connector into the vehicle port" })).toBeInTheDocument();
        expect(screen.getAllByText("Not connected").length).toBeGreaterThanOrEqual(2);
    });

    it("plugs in and unplugs the OBD connector", () => {
        vi.useFakeTimers();
        try {
            renderHome();

            fireEvent.click(screen.getByRole("button", { name: "Plug the OBD connector into the vehicle port" }));
            act(() => {
                vi.advanceTimersByTime(900);
            });
            // Connected message is screen-reader only (no visible text) — the
            // tablet badge disappears, only the tool's sr-only status remains.
            expect(screen.getAllByText("Vehicle connected")).toHaveLength(1);
            expect(screen.getByRole("button", { name: "Unplug the OBD connector from the vehicle port" })).toBeInTheDocument();

            fireEvent.click(screen.getByRole("button", { name: "Unplug the OBD connector from the vehicle port" }));
            act(() => {
                vi.advanceTimersByTime(500);
            });
            expect(screen.getAllByText("Not connected").length).toBeGreaterThanOrEqual(2);
        } finally {
            vi.useRealTimers();
        }
    });
});
