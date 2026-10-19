/* Scan-lab sound effects (Web Audio, no assets). Sounds are short and
   optional — the mute preference persists per browser and defaults to
   audible on first use. All playback is best-effort: environments
   without Web Audio (or before a user gesture) silently no-op. */

const MUTE_KEY = "hbt:scanner-sounds-muted";
const VOLUME_KEY = "hbt:scanner-sound-volume";

let audioCtx: AudioContext | null = null;
let mutedCache: boolean | null = null;

function ctx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (audioCtx) return audioCtx;
    try {
        const Ctor =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;
        if (!Ctor) return null;
        audioCtx = new Ctor();
    } catch {
        return null;
    }
    return audioCtx;
}

export function areScannerSoundsMuted(): boolean {
    if (mutedCache !== null) return mutedCache;
    try {
        mutedCache = window.localStorage.getItem(MUTE_KEY) === "1";
    } catch {
        mutedCache = false;
    }
    return mutedCache;
}

export function setScannerSoundsMuted(muted: boolean): void {
    mutedCache = muted;
    try {
        window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
        // Ignore storage failures.
    }
}

/** Playback level 0..1 (slider on the Settings card), default full. */
export function getScannerSoundsVolume(): number {
    try {
        const raw = window.localStorage.getItem(VOLUME_KEY);
        if (raw === null) return 1;
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 1;
    } catch {
        return 1;
    }
}

export function setScannerSoundsVolume(volume: number): void {
    try {
        window.localStorage.setItem(VOLUME_KEY, String(Math.min(1, Math.max(0, volume))));
    } catch {
        // Ignore storage failures.
    }
}

/** Two-tone confirmation beep (scan finished / code cleared). */
export function playConfirm(): void {
    if (areScannerSoundsMuted()) return;
    const vol = getScannerSoundsVolume();
    if (vol <= 0) return;
    const c = ctx();
    if (!c) return;
    try {
        if (c.state === "suspended") void c.resume();
        const at = c.currentTime;
        for (const [freq, start, dur] of [
            [880, 0, 0.09],
            [1320, 0.1, 0.12],
        ] as const) {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, at + start);
            gain.gain.exponentialRampToValueAtTime(0.18 * vol, at + start + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + start + dur);
            osc.connect(gain).connect(c.destination);
            osc.start(at + start);
            osc.stop(at + start + dur + 0.02);
        }
    } catch {
        // Best-effort only.
    }
}

/** Single low tick (each ECU revealed during the scan). */
export function playTick(): void {
    if (areScannerSoundsMuted()) return;
    const vol = getScannerSoundsVolume();
    if (vol <= 0) return;
    const c = ctx();
    if (!c) return;
    try {
        if (c.state === "suspended") void c.resume();
        const at = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "triangle";
        osc.frequency.value = 520;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.09 * vol, at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
        osc.connect(gain).connect(c.destination);
        osc.start(at);
        osc.stop(at + 0.08);
    } catch {
        // Best-effort only.
    }
}

/** Warning buzz (fault found / unplugged mid-scan). */
export function playWarn(): void {
    if (areScannerSoundsMuted()) return;
    const vol = getScannerSoundsVolume();
    if (vol <= 0) return;
    const c = ctx();
    if (!c) return;
    try {
        if (c.state === "suspended") void c.resume();
        const at = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, at);
        osc.frequency.exponentialRampToValueAtTime(160, at + 0.18);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.08 * vol, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
        osc.connect(gain).connect(c.destination);
        osc.start(at);
        osc.stop(at + 0.22);
    } catch {
        // Best-effort only.
    }
}
