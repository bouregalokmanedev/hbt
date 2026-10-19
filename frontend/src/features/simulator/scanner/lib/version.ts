/* Scanner tablet version info for the Updates card. Maintainers bump
   SCANNER_LATEST_VERSION when a release ships — students then see the
   "update available" state until this device is updated. */

export const SCANNER_APP_VERSION = "1.4.0";
export const SCANNER_LATEST_VERSION = "1.4.0";

/** True when version `a` is newer than version `b` (numeric segments). */
export function isNewerVersion(a: string, b: string): boolean {
    const pa = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
    const pb = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0;
        const y = pb[i] ?? 0;
        if (x !== y) return x > y;
    }
    return false;
}
