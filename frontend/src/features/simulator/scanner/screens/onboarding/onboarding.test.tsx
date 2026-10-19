import { render, screen, fireEvent, act } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import { StartChecklist } from "./StartChecklist";
import { TourOverlay } from "./TourOverlay";
import {
    isTourDone,
    markScannerStep,
    markTourDone,
    resetScannerSteps,
    resetTourDone,
} from "../../lib/scannerProgress";

function wrap(ui: React.ReactNode) {
    return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

beforeEach(() => {
    localStorage.clear();
    resetScannerSteps();
    resetTourDone();
});

describe("TourOverlay", () => {
    it("renders nothing when closed", () => {
        wrap(
            <TourOverlay
                open={false}
                obdConnected={false}
                view="home"
                onFinish={vi.fn()}
                onSkip={vi.fn()}
            />,
        );
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("opens on the tablet step with progress 1/4", () => {
        wrap(
            <TourOverlay
                open
                obdConnected={false}
                view="home"
                onFinish={vi.fn()}
                onSkip={vi.fn()}
            />,
        );
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
        expect(screen.getByText("Your diagnostic tablet")).toBeInTheDocument();
    });

    it("advances with Next and finishes on the last step", () => {
        const onFinish = vi.fn();
        wrap(
            <TourOverlay
                open
                obdConnected={false}
                view="home"
                onFinish={onFinish}
                onSkip={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
        expect(screen.getByText("Plug in the OBD connector")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
        expect(screen.getByText("You're all set")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Start exploring" }));
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(isTourDone()).toBe(true);
    });

    it("disables Next while waiting for the OBD action, then auto-advances", () => {
        vi.useFakeTimers();
        try {
            const { rerender } = wrap(
                <TourOverlay
                    open
                    obdConnected={false}
                    view="home"
                    onFinish={vi.fn()}
                    onSkip={vi.fn()}
                />,
            );
            // Jump to the OBD step (awaiting).
            fireEvent.click(screen.getByRole("button", { name: "Next" }));
            const next = screen.getByRole("button", { name: "Waiting for you…" });
            expect(next).toBeDisabled();

            // Student plugs the OBD → auto-advance after the delay.
            rerender(
                <I18nextProvider i18n={i18n}>
                    <TourOverlay
                        open
                        obdConnected
                        view="home"
                        onFinish={vi.fn()}
                        onSkip={vi.fn()}
                    />
                </I18nextProvider>,
            );
            act(() => {
                vi.advanceTimersByTime(400);
            });
            expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it("skips via the skip button without marking the tour done", () => {
        const onSkip = vi.fn();
        wrap(
            <TourOverlay
                open
                obdConnected={false}
                view="home"
                onFinish={vi.fn()}
                onSkip={onSkip}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Skip" }));
        expect(onSkip).toHaveBeenCalled();
        expect(isTourDone()).toBe(false);
    });
});

describe("StartChecklist", () => {
    it("shows the collapsed pill at 0/7 and expands on click", () => {
        wrap(<StartChecklist onReplayTour={vi.fn()} />);
        const pill = screen.getByRole("button", { name: /Getting started — 0\/7/ });
        expect(pill).toBeInTheDocument();

        fireEvent.click(pill);
        expect(screen.getByRole("dialog", { name: "Getting started" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Collapse checklist" }),
        ).toBeInTheDocument();
    });

    it("reflects marked steps live and turns green when all done", () => {
        act(() => {
            markScannerStep("plugged");
            markScannerStep("diagnosis");
        });
        wrap(<StartChecklist onReplayTour={vi.fn()} />);

        expect(
            screen.getByRole("button", { name: /Getting started — 2\/7/ }),
        ).toBeInTheDocument();

        act(() => {
            for (const s of ["scan", "dtcRead", "dtcCleared", "liveData", "specialFunction"] as const) {
                markScannerStep(s);
            }
        });
        expect(screen.getByRole("button", { name: "All done!" })).toBeInTheDocument();
    });

    it("marks done rows and resets progress when restarting the tour", () => {
        const onReplayTour = vi.fn();
        markScannerStep("plugged");
        wrap(<StartChecklist onReplayTour={onReplayTour} />);

        fireEvent.click(screen.getByRole("button", { name: /Getting started — 1\/7/ }));
        const row = screen.getByRole("listitem", {
            name: /Plug in the OBD connector — Done/,
        });
        expect(row).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Restart tour" }));
        expect(onReplayTour).toHaveBeenCalled();
        expect(
            screen.getByRole("button", { name: /Getting started — 0\/7/ }),
        ).toBeInTheDocument();
    });

    it("persists tour completion when replay finishes", () => {
        markTourDone();
        expect(isTourDone()).toBe(true);
    });
});
