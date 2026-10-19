import { render, screen, act } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";

import {
    scannerMissionsStore,
    type ScannerMission,
} from "@/features/instructor/data/scannerMissionsStore";
import { MissionPanel, isObjectiveDone, missionComplete } from "./MissionPanel";
import { markScannerStep, resetScannerSteps } from "../lib/scannerProgress";

function seedMission(overrides: Partial<ScannerMission> = {}): ScannerMission {
    return scannerMissionsStore.add({
        title: "Find the misfire",
        description: "Scan and locate P0301",
        vehicleVariantId: "v-15",
        vehicleLabel: "Honda Civic · 1.5 VTEC",
        objectives: [
            { id: "o1", kind: "scan", label: "Run an automatic scan" },
            { id: "o2", kind: "readDtc", label: "Read the fault codes", dtcCode: "P0301" },
        ],
        ...overrides,
    });
}

function renderPanel() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MissionPanel />
        </I18nextProvider>,
    );
}

beforeEach(() => {
    localStorage.clear();
    scannerMissionsStore.reset();
    resetScannerSteps();
});

describe("mission completion logic", () => {
    it("maps objective kinds onto getting-started steps", () => {
        const steps = new Set(["scan", "dtcRead"]);
        expect(isObjectiveDone({ id: "a", kind: "scan", label: "s" }, steps)).toBe(true);
        expect(isObjectiveDone({ id: "b", kind: "readDtc", label: "r" }, steps)).toBe(true);
        expect(isObjectiveDone({ id: "c", kind: "clearDtc", label: "c" }, steps)).toBe(false);
        expect(isObjectiveDone({ id: "d", kind: "liveData", label: "l" }, steps)).toBe(false);
    });

    it("marks a mission complete only when every objective is done", () => {
        const mission = seedMission();
        scannerMissionsStore.update(mission.id, { published: true });
        const stored = scannerMissionsStore.list()[0];

        expect(missionComplete(stored, new Set())).toBe(false);
        expect(missionComplete(stored, new Set(["scan"]))).toBe(false);
        expect(missionComplete(stored, new Set(["scan", "dtcRead"]))).toBe(true);
    });
});

describe("MissionPanel", () => {
    it("renders nothing when no missions are published", () => {
        seedMission({ published: false });
        const { container } = renderPanel();
        expect(container.firstChild).toBeNull();
    });

    it("shows a published mission with its objectives and 0/1 counter", () => {
        const mission = seedMission();
        scannerMissionsStore.update(mission.id, { published: true });

        renderPanel();
        expect(screen.getByRole("dialog", { name: "Missions" })).toBeInTheDocument();
        expect(screen.getByText("Find the misfire")).toBeInTheDocument();
        expect(screen.getByText("Run an automatic scan")).toBeInTheDocument();
        expect(screen.getByText("Read the fault codes")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Missions — 0\/1/ })).toBeInTheDocument();
    });

    it("ticks objectives live as the student performs them", () => {
        const mission = seedMission();
        scannerMissionsStore.update(mission.id, { published: true });

        renderPanel();
        expect(
            screen.getByRole("listitem", { name: "Run an automatic scan — Not done yet" }),
        ).toBeInTheDocument();

        act(() => markScannerStep("scan"));
        expect(
            screen.getByRole("listitem", { name: "Run an automatic scan — Done" }),
        ).toBeInTheDocument();
        // Not every objective done yet → still 0/1 complete.
        expect(screen.getByRole("button", { name: /Missions — 0\/1/ })).toBeInTheDocument();

        act(() => markScannerStep("dtcRead"));
        expect(screen.getByRole("button", { name: /Missions — 1\/1/ })).toBeInTheDocument();
        expect(screen.getByText("Find the misfire")).toHaveClass("line-through");
    });

    it("hides missions from other vehicles when variantId is set", () => {
        const mission = seedMission();
        scannerMissionsStore.update(mission.id, { published: true });

        const { container, rerender } = renderPanel();
        expect(container.firstChild).not.toBeNull();

        rerender(
            <I18nextProvider i18n={i18n}>
                <MissionPanel variantId="other-variant" />
            </I18nextProvider>,
        );
        expect(container.firstChild).toBeNull();
    });

    it("missions store publishes and filters by vehicle", () => {
        const mission = seedMission();
        expect(scannerMissionsStore.published()).toHaveLength(0);
        scannerMissionsStore.update(mission.id, { published: true });
        expect(scannerMissionsStore.published()).toHaveLength(1);
        expect(scannerMissionsStore.publishedFor("v-15")).toHaveLength(1);
        expect(scannerMissionsStore.publishedFor("nope")).toHaveLength(0);

        scannerMissionsStore.remove(mission.id);
        expect(scannerMissionsStore.list()).toHaveLength(0);
    });
});
