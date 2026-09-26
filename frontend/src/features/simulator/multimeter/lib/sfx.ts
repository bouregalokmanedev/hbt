/**
 * Lightweight Web Audio synth for lab feedback — no asset files, no deps.
 * Call from UI only (engines stay framework/audio-free).
 */

const MUTE_KEY = "hbt:sfx-muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function isMuted(): boolean {
    try {
        return window.localStorage.getItem(MUTE_KEY) === "1";
    } catch {
        return false;
    }
}

function ensure(): { ctx: AudioContext; master: GainNode } | null {
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = isMuted() ? 0 : 0.35;
        master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    if (!master) return null;
    return { ctx, master };
}

function tone(
    freq: number,
    opts: { dur?: number; type?: OscillatorType; gain?: number; delay?: number; slideTo?: number } = {},
): void {
    const rig = ensure();
    if (!rig || !ctx || !master || isMuted()) return;
    const { dur = 0.07, type = "sine", gain = 0.12, delay = 0, slideTo } = opts;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
}

function noise(opts: { dur?: number; gain?: number; delay?: number } = {}): void {
    const rig = ensure();
    if (!rig || !ctx || !master || isMuted()) return;
    const { dur = 0.05, gain = 0.06, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2400;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
}

export type SfxEvent =
    | "dial"
    | "jack"
    | "arm"
    | "seat"
    | "detach"
    | "clear"
    | "reading"
    | "good"
    | "bad"
    | "hint"
    | "pass"
    | "fault"
    | "select";

export const sfx = {
    play(event: SfxEvent): void {
        switch (event) {
            case "dial":
                noise({ dur: 0.03, gain: 0.05 });
                tone(1200, { dur: 0.04, type: "square", gain: 0.04 });
                break;
            case "jack":
                noise({ dur: 0.04, gain: 0.07 });
                tone(700, { dur: 0.05, type: "triangle", gain: 0.07, slideTo: 980 });
                break;
            case "arm":
                tone(560, { dur: 0.05, type: "sine", gain: 0.07 });
                break;
            case "seat":
                tone(660, { dur: 0.05, type: "sine", gain: 0.09 });
                tone(990, { dur: 0.07, type: "sine", gain: 0.07, delay: 0.04 });
                noise({ dur: 0.03, gain: 0.04, delay: 0.02 });
                break;
            case "detach":
                tone(420, { dur: 0.06, type: "triangle", gain: 0.06, slideTo: 240 });
                break;
            case "clear":
                tone(300, { dur: 0.08, type: "triangle", gain: 0.05, slideTo: 180 });
                break;
            case "reading":
                tone(880, { dur: 0.05, type: "sine", gain: 0.05 });
                break;
            case "good":
                tone(660, { dur: 0.06, type: "sine", gain: 0.08 });
                tone(880, { dur: 0.08, type: "sine", gain: 0.08, delay: 0.06 });
                break;
            case "bad":
                tone(200, { dur: 0.14, type: "sawtooth", gain: 0.07, slideTo: 120 });
                break;
            case "hint":
                tone(520, { dur: 0.07, type: "sine", gain: 0.06 });
                break;
            case "pass":
                tone(523, { dur: 0.1, type: "sine", gain: 0.09 });
                tone(659, { dur: 0.1, type: "sine", gain: 0.09, delay: 0.1 });
                tone(784, { dur: 0.14, type: "sine", gain: 0.1, delay: 0.2 });
                tone(1047, { dur: 0.18, type: "sine", gain: 0.1, delay: 0.32 });
                break;
            case "fault":
                tone(392, { dur: 0.1, type: "square", gain: 0.06 });
                tone(311, { dur: 0.12, type: "square", gain: 0.06, delay: 0.1 });
                tone(233, { dur: 0.18, type: "square", gain: 0.07, delay: 0.22 });
                break;
            case "select":
                tone(740, { dur: 0.04, type: "sine", gain: 0.05 });
                break;
        }
    },
    isMuted,
    setMuted(muted: boolean): void {
        try {
            window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
        } catch {
            // ignore
        }
        if (master) master.gain.value = muted ? 0 : 0.35;
    },
    toggleMute(): boolean {
        const next = !isMuted();
        sfx.setMuted(next);
        return next;
    },
};
