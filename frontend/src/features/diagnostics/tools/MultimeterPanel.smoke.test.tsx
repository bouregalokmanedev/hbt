import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { MultimeterPanel } from "./MultimeterPanel";

function renderWithI18n(ui: React.ReactElement) {
    return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

// Minimal Web Audio mock so sfx doesn't throw in jsdom.
class FakeAudioParam {
    value = 0;
    setValueAtTime() {
        return this;
    }
    exponentialRampToValueAtTime() {
        return this;
    }
}
class FakeNode {
    connect() {
        return this;
    }
    disconnect() {}
}
class FakeGain extends FakeNode {
    gain = new FakeAudioParam();
}
class FakeOsc extends FakeNode {
    type = "sine";
    frequency = new FakeAudioParam();
    start() {}
    stop() {}
}
class FakeCtx {
    state = "running";
    currentTime = 0;
    sampleRate = 44100;
    destination = new FakeNode();
    resume() {
        return Promise.resolve();
    }
    createGain() {
        return new FakeGain();
    }
    createOscillator() {
        return new FakeOsc();
    }
    createBuffer() {
        return { getChannelData: () => new Float32Array(16) };
    }
    createBufferSource() {
        return Object.assign(new FakeNode(), { buffer: null, start() {} });
    }
    createBiquadFilter() {
        return Object.assign(new FakeNode(), {
            type: "",
            frequency: new FakeAudioParam(),
        });
    }
}

describe("MultimeterPanel live bench (smoke)", () => {
    beforeEach(() => {
        vi.stubGlobal("AudioContext", FakeCtx);
        localStorage.clear();
    });

    it("renders bench chrome, checklist, and syncs dial mode up to parent", async () => {
        const onModeChange = vi.fn();
        const onRed = vi.fn();
        const onBlack = vi.fn();
        const onReading = vi.fn();

        renderWithI18n(
            <MultimeterPanel
                mode="OFF"
                redProbe=""
                blackProbe=""
                reading=""
                componentRef="A1"
                onModeChange={onModeChange}
                onRedProbeChange={onRed}
                onBlackProbeChange={onBlack}
                onReadingChange={onReading}
            />,
        );

        // Bench chrome
        expect(screen.getByText("Multimeter bench")).toBeInTheDocument();
        // ref appears in header + art card
        expect(screen.getAllByText("A1").length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Injector 1/).length).toBeGreaterThan(0);
        expect(screen.getByText("Your measurement")).toBeInTheDocument();
        expect(screen.getByText("Live reading")).toBeInTheDocument();
        expect(screen.getByText("Meter off")).toBeInTheDocument();

        // Status chip flips off → place probes after dial change
        const vdc = screen.getByRole("button", { name: "VDC" });
        fireEvent.click(vdc);

        await waitFor(() => expect(onModeChange).toHaveBeenCalledWith("VDC"));
        expect(screen.queryByText("Meter off")).not.toBeInTheDocument();
    });

    it("keeps lead arms and photo/sfx controls interactive", async () => {
        renderWithI18n(
            <MultimeterPanel
                mode="VDC"
                redProbe=""
                blackProbe=""
                reading=""
                componentRef="A1"
                onModeChange={vi.fn()}
                onRedProbeChange={() => {}}
                onBlackProbeChange={() => {}}
                onReadingChange={() => {}}
            />,
        );

        // SFX toggle: button text is "Sound on" / "Sound off"
        const sfxBtn = screen.getByRole("button", { name: /^Sound (on|off)$/i });
        expect(sfxBtn).toBeInTheDocument();
        fireEvent.click(sfxBtn);

        // Photo toggle if available
        const photoBtn = screen.getByRole("button", { name: /Reference photo|Hide photo/i });
        fireEvent.click(photoBtn);

        // Submit hint visible
        expect(
            screen.getByText(/Set the dial, seat the jacks, place both probes/i),
        ).toBeInTheDocument();
    });
});
