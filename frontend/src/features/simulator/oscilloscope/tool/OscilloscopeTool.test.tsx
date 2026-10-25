import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScopeEngine } from "../engine/scope.engine";
import { OscilloscopeTool } from "./OscilloscopeTool";

vi.mock("@react-three/fiber", () => ({
    Canvas: ({ children }: { children?: ReactNode }) => <div data-testid="scope-canvas">{children}</div>,
}));

vi.mock("./Scene", () => ({
    Scene: (props: {
        resetSignal: number;
        onPower: () => void;
        onChannel: (channel: "A" | "B") => void;
        onRun: () => void;
    }) => (
        <div data-testid="scope-scene" data-reset={props.resetSignal}>
            <button type="button" data-testid="scope-scene-power" onClick={props.onPower}>
                power
            </button>
            <button type="button" data-testid="scope-scene-b" onClick={() => props.onChannel("B")}>
                channel b
            </button>
            <button type="button" data-testid="scope-scene-run" onClick={props.onRun}>
                run
            </button>
        </div>
    ),
}));

function mockWebGL(available: boolean) {
    return vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
        () => (available ? ({} as unknown as CanvasRenderingContext2D) : null),
    );
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("OscilloscopeTool", () => {
    it("renders the interactive bench and switches interaction modes", async () => {
        mockWebGL(true);
        const engine = new ScopeEngine({ vehicleId: "test-vehicle" });
        render(<OscilloscopeTool engine={engine} state={engine.getState()} />);

        const tool = screen.getByTestId("oscilloscope-tool");
        await waitFor(() => expect(screen.getByTestId("scope-canvas")).toBeInTheDocument());
        expect(tool).toHaveAttribute("data-interaction", "orbit");
        expect(tool).toHaveAttribute("data-powered", "true");
        expect(screen.getByTestId("scope-mode-orbit")).toHaveAttribute("aria-pressed", "true");

        fireEvent.click(screen.getByTestId("scope-mode-move"));
        expect(tool).toHaveAttribute("data-interaction", "move");
        expect(screen.getByText(/drag the scope anywhere/i)).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("scope-mode-rotate"));
        expect(tool).toHaveAttribute("data-interaction", "rotate");
        expect(screen.getByText(/spin the scope/i)).toBeInTheDocument();
    });

    it("mirrors channel and power changes from the 3D controls", async () => {
        mockWebGL(true);
        const engine = new ScopeEngine({ vehicleId: "test-vehicle" });
        render(<OscilloscopeTool engine={engine} state={engine.getState()} />);

        await waitFor(() => expect(screen.getByTestId("scope-scene")).toBeInTheDocument());
        fireEvent.click(screen.getByTestId("scope-scene-b"));
        expect(screen.getByTestId("oscilloscope-tool")).toHaveAttribute("data-channel", "B");

        fireEvent.click(screen.getByTestId("scope-scene-power"));
        expect(screen.getByTestId("oscilloscope-tool")).toHaveAttribute("data-powered", "false");
        expect(screen.getByText("Off")).toBeInTheDocument();
    });

    it("resets the scene layout from the toolbar", async () => {
        mockWebGL(true);
        const engine = new ScopeEngine({ vehicleId: "test-vehicle" });
        render(<OscilloscopeTool engine={engine} state={engine.getState()} />);

        const scene = await screen.findByTestId("scope-scene");
        expect(scene).toHaveAttribute("data-reset", "0");
        fireEvent.click(screen.getByTestId("scope-reset"));
        expect(scene).toHaveAttribute("data-reset", "1");
    });

    it("shows the CSS fallback when WebGL is unavailable", async () => {
        mockWebGL(false);
        const engine = new ScopeEngine({ vehicleId: "test-vehicle" });
        render(<OscilloscopeTool engine={engine} state={engine.getState()} />);

        expect(await screen.findByText("3D preview unavailable")).toBeInTheDocument();
        expect(screen.queryByTestId("scope-canvas")).not.toBeInTheDocument();
    });
});
