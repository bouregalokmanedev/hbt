import { describe, expect, it } from "vitest";

import { angleForMode, DIAL_MODES, MODE_BY_ID, nearestMode } from "./modes";

describe("dial modes", () => {
    it("keeps ids and angles unique and sorted", () => {
        expect(new Set(DIAL_MODES.map((mode) => mode.id)).size).toBe(DIAL_MODES.length);
        const angles = DIAL_MODES.map((mode) => mode.angle);
        expect(new Set(angles).size).toBe(angles.length);
        expect([...angles].sort((a, b) => a - b)).toEqual(angles);
    });

    it("maps every id to its angle and record entry", () => {
        for (const mode of DIAL_MODES) {
            expect(angleForMode(mode.id)).toBe(mode.angle);
            expect(MODE_BY_ID[mode.id]).toBe(mode);
        }
    });

    it("snaps to the exact mode at each angle", () => {
        for (const mode of DIAL_MODES) {
            expect(nearestMode(mode.angle).id).toBe(mode.id);
        }
    });

    it("picks the closest neighbour between modes", () => {
        expect(nearestMode(-125).id).toBe("v600");
        expect(nearestMode(-115).id).toBe("v200");
        expect(nearestMode(12).id).toBe("off");
        expect(nearestMode(24).id).toBe("r20m");
    });

    it("wraps angles beyond a full turn", () => {
        expect(nearestMode(-999).id).toBe("r200k");
        expect(nearestMode(999).id).toBe("v20");
    });
});
