import { useSyncExternalStore } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { MeterProcedureEngine } from "../engine/meter.engine";
import { DiagnosisScreen } from "../screens/DiagnosisScreen";
import { measureProbeWires } from "./probeGeometry";

vi.mock("../lib/sfx", () => ({
    sfx: {
        play: vi.fn(),
        isMuted: () => false,
        toggleMute: () => false,
    },
}));

/** Mirrors the production hosts (workbench / diagnostics panel) which
 *  subscribe to the engine and re-render the screen on every emission. */
function SubscribedBench({ engine }: { engine: MeterProcedureEngine }) {
    useSyncExternalStore(
        (listener) => engine.subscribe(listener),
        () => engine.getState(),
        () => engine.getState(),
    );
    return <DiagnosisScreen engine={engine} />;
}

function renderBench(engine: MeterProcedureEngine) {
    return render(
        <I18nextProvider i18n={i18n}>
            <SubscribedBench engine={engine} />
        </I18nextProvider>,
    );
}

describe("probe wire overlay (cross-panel cables)", () => {
    let engine: MeterProcedureEngine;

    beforeEach(() => {
        localStorage.clear();
        engine = new MeterProcedureEngine({ vehicleId: "test-vehicle", focus: "A1" });
    });

    afterEach(() => {
        engine.dispose();
    });

    it("shows the drag-onto-a-pin probe panel with no cables until a probe is placed", async () => {
        const { container } = renderBench(engine);

        expect(screen.getByText("Probes — drag onto a pin")).toBeInTheDocument();
        expect(screen.queryByTestId("probe-wires")).not.toBeInTheDocument();
        expect(container.querySelectorAll("[data-probe-target]").length).toBeGreaterThan(0);
        expect(container.querySelectorAll("[data-jack-target]").length).toBe(4);
    });

    it("draws one cable per placed probe from the meter jack to the pin", async () => {
        renderBench(engine);

        act(() => {
            engine.placeProbe("c1", "red");
        });
        const wires = await screen.findByTestId("probe-wires");
        expect(wires.querySelectorAll("path").length).toBe(3);

        act(() => {
            engine.placeProbe("c2", "black");
        });
        await waitFor(() => expect(screen.getByTestId("probe-wires").querySelectorAll("path").length).toBe(6));

        // Probe rows show the human pin label, not the raw target id.
        expect(screen.getAllByText("Component pin 1").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Component pin 2").length).toBeGreaterThan(0);
    });

    it("removes a cable when the lead is detached and clears all on clearProbes", async () => {
        renderBench(engine);
        act(() => {
            engine.placeProbe("c1", "red");
            engine.placeProbe("c2", "black");
        });
        await waitFor(() => expect(screen.getByTestId("probe-wires").querySelectorAll("path").length).toBe(6));

        act(() => {
            engine.detachProbe("red");
        });
        await waitFor(() => expect(screen.getByTestId("probe-wires").querySelectorAll("path").length).toBe(3));

        act(() => {
            engine.clearProbes();
        });
        await waitFor(() => expect(screen.queryByTestId("probe-wires")).not.toBeInTheDocument());
    });

    it("measures nothing without a scope root or unplaced probes", () => {
        expect(measureProbeWires(null, engine.getState())).toEqual([]);
        expect(measureProbeWires(document, engine.getState())).toEqual([]);
    });
});
