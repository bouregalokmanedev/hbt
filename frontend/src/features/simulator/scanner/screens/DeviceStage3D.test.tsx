import { render, screen, fireEvent } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { DeviceStage3D } from "./DeviceStage3D";

function renderStage(children = <div>front content</div>) {
    return render(
        <I18nextProvider i18n={i18n}>
            <DeviceStage3D label="Test tablet">{children}</DeviceStage3D>
        </I18nextProvider>,
    );
}

describe("DeviceStage3D", () => {
    it("renders the front content, a flip control and the stage group", () => {
        renderStage();

        expect(screen.getByText("front content")).toBeInTheDocument();
        expect(
            screen.getByRole("group", { name: /3D view/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Turn over" }),
        ).toBeInTheDocument();
    });

    it("flipping swaps the control label and keeps the front content mounted", () => {
        renderStage();

        fireEvent.click(screen.getByRole("button", { name: "Turn over" }));
        expect(
            screen.getByRole("button", { name: "Turn back" }),
        ).toBeInTheDocument();
        // Front face stays mounted (state preserved) — just hidden by 3D.
        expect(screen.getByText("front content")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Turn back" }));
        expect(
            screen.getByRole("button", { name: "Turn over" }),
        ).toBeInTheDocument();
    });

    it("keyboard: Enter flips when the stage itself is focused, Escape resets", () => {
        renderStage();

        const stage = screen.getByRole("group", { name: /3D view/ });
        stage.focus();
        fireEvent.keyDown(stage, { key: "Enter" });
        expect(
            screen.getByRole("button", { name: "Turn back" }),
        ).toBeInTheDocument();

        fireEvent.keyDown(stage, { key: "Escape" });
        // Escape only resets tilt; flip state is untouched.
        expect(
            screen.getByRole("button", { name: "Turn back" }),
        ).toBeInTheDocument();
    });

    it("keyboard arrows adjust tilt without throwing", () => {
        renderStage();

        const stage = screen.getByRole("group", { name: /3D view/ });
        stage.focus();
        for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
            fireEvent.keyDown(stage, { key });
        }
        expect(screen.getByText("front content")).toBeInTheDocument();
    });

    it("drag inside the screen area does not start a rotation", () => {
        renderStage(
            <div data-device-screen>
                <button type="button">tile</button>
            </div>,
        );

        const stage = screen.getByRole("group", { name: /3D view/ });
        fireEvent.pointerDown(screen.getByRole("button", { name: "tile" }), {
            button: 0,
            pointerId: 1,
        });
        // No error, tile still clickable.
        fireEvent.click(screen.getByRole("button", { name: "tile" }));
        expect(stage).toBeInTheDocument();
    });

    it("drag on the bezel starts without errors and click on flip control is separate", () => {
        renderStage();

        const stage = screen.getByRole("group", { name: /3D view/ });
        fireEvent.pointerDown(stage, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
        fireEvent.pointerMove(stage, { pointerId: 1, clientX: 60, clientY: 30 });
        fireEvent.pointerUp(stage, { pointerId: 1, clientX: 60, clientY: 30 });
        expect(stage).toBeInTheDocument();
    });

    it("bezel drag spins a full 360° with no clamp and stops at any angle", () => {
        renderStage();

        const stage = screen.getByRole("group", { name: /3D view/ });
        // dy = (3010 − 10) × 0.28 = 840° → 840 mod 360 = 120° → back facing.
        // The old front/back clamp (±35°) would have kept it on the front.
        fireEvent.pointerDown(stage, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
        fireEvent.pointerMove(stage, { pointerId: 1, clientX: 3010, clientY: 10 });
        fireEvent.pointerUp(stage, { pointerId: 1, clientX: 3010, clientY: 10 });
        expect(
            screen.getByRole("button", { name: "Turn back" }),
        ).toBeInTheDocument();

        // A short extra drag stops where it lands (120° + 8.4° ≈ 128°, still
        // back-facing) instead of snapping back to a face.
        fireEvent.pointerDown(stage, { button: 0, pointerId: 2, clientX: 100, clientY: 100 });
        fireEvent.pointerMove(stage, { pointerId: 2, clientX: 130, clientY: 100 });
        fireEvent.pointerUp(stage, { pointerId: 2, clientX: 130, clientY: 100 });
        expect(
            screen.getByRole("button", { name: "Turn back" }),
        ).toBeInTheDocument();

        // The turn button adds 180° from the parked angle: 128° + 180° =
        // 308° → front facing again.
        fireEvent.click(screen.getByRole("button", { name: "Turn back" }));
        expect(
            screen.getByRole("button", { name: "Turn over" }),
        ).toBeInTheDocument();
    });

    it("Escape squares up to the nearest face without changing the shown face", () => {
        renderStage();

        const stage = screen.getByRole("group", { name: /3D view/ });
        // 840° → back facing; Escape snaps to the nearest back face (900°).
        fireEvent.pointerDown(stage, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
        fireEvent.pointerMove(stage, { pointerId: 1, clientX: 3010, clientY: 10 });
        fireEvent.pointerUp(stage, { pointerId: 1, clientX: 3010, clientY: 10 });
        expect(
            screen.getByRole("button", { name: "Turn back" }),
        ).toBeInTheDocument();

        fireEvent.keyDown(stage, { key: "Escape" });
        expect(
            screen.getByRole("button", { name: "Turn back" }),
        ).toBeInTheDocument();
    });
});
