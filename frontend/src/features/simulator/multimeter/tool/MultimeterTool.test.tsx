import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MultimeterTool } from "./MultimeterTool";

vi.mock("@react-three/fiber", () => ({
    Canvas: ({ children }: { children?: ReactNode }) => <div data-testid="mm-canvas">{children}</div>,
}));

vi.mock("./Scene", () => ({
    Scene: (props: {
        resetSignal: number;
        onMode: (mode: "r2k") => void;
        onHold: () => void;
        onBacklight: () => void;
    }) => (
        <div data-testid="mm-scene" data-reset={props.resetSignal}>
            <button type="button" data-testid="mm-scene-r2k" onClick={() => props.onMode("r2k")}>
                r2k
            </button>
            <button type="button" data-testid="mm-scene-hold" onClick={props.onHold}>
                hold
            </button>
            <button type="button" data-testid="mm-scene-light" onClick={props.onBacklight}>
                light
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

describe("MultimeterTool", () => {
    it("renders the interactive bench and switches interaction modes", async () => {
        mockWebGL(true);
        render(<MultimeterTool />);

        const tool = screen.getByTestId("multimeter-tool");
        await waitFor(() => expect(screen.getByTestId("mm-canvas")).toBeInTheDocument());
        expect(tool).toHaveAttribute("data-mode", "v20");
        expect(tool).toHaveAttribute("data-interaction", "orbit");
        expect(screen.getByTestId("mm-mode-orbit")).toHaveAttribute("aria-pressed", "true");

        fireEvent.click(screen.getByTestId("mm-mode-move"));
        expect(tool).toHaveAttribute("data-interaction", "move");
        expect(screen.getByTestId("mm-mode-move")).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText(/drag the meter anywhere/i)).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("mm-mode-rotate"));
        expect(tool).toHaveAttribute("data-interaction", "rotate");
        expect(screen.getByText(/spin the meter/i)).toBeInTheDocument();
    });

    it("updates the reading and hold chip from the 3D controls", async () => {
        mockWebGL(true);
        render(<MultimeterTool />);

        await waitFor(() => expect(screen.getByTestId("mm-scene")).toBeInTheDocument());
        fireEvent.click(screen.getByTestId("mm-scene-r2k"));
        expect(screen.getByTestId("multimeter-tool")).toHaveAttribute("data-mode", "r2k");
        expect(screen.getByText(/1\.248 kΩ/)).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("mm-scene-hold"));
        expect(screen.getByText("Hold")).toBeInTheDocument();
    });

    it("resets the scene layout from the toolbar", async () => {
        mockWebGL(true);
        render(<MultimeterTool />);

        const scene = await screen.findByTestId("mm-scene");
        expect(scene).toHaveAttribute("data-reset", "0");
        fireEvent.click(screen.getByTestId("mm-reset"));
        expect(scene).toHaveAttribute("data-reset", "1");
        fireEvent.click(screen.getByTestId("mm-reset"));
        expect(scene).toHaveAttribute("data-reset", "2");
    });

    it("shows the CSS meter fallback when WebGL is unavailable", async () => {
        mockWebGL(false);
        render(<MultimeterTool />);

        expect(await screen.findByText("3D preview unavailable")).toBeInTheDocument();
        expect(screen.queryByTestId("mm-canvas")).not.toBeInTheDocument();
        expect(screen.getByTestId("multimeter-tool")).toHaveAttribute("data-mode", "v20");
    });
});
