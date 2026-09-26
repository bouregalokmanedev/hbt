import { useEffect, useMemo, useState } from "react";

export function useDiagnosticTimer(startedAt: string | null | undefined, timeLimitMinutes: number | null | undefined) {
    const startedMs = useMemo(() => (startedAt ? new Date(startedAt).getTime() : null), [startedAt]);
    const totalMs = useMemo(() => (timeLimitMinutes ? timeLimitMinutes * 60_000 : null), [timeLimitMinutes]);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (startedMs === null || totalMs === null) return;
        const id = window.setInterval(() => setNow(Date.now()), 1_000);
        return () => window.clearInterval(id);
    }, [startedMs, totalMs]);

    if (startedMs === null || totalMs === null) return { remainingMs: null as number | null, isExpired: false, formatted: null as string | null, progress: null as number | null };
    const elapsed = now - startedMs;
    const remainingMs = Math.max(0, totalMs - elapsed);
    const isExpired = remainingMs <= 0;
    const mm = Math.floor(remainingMs / 60_000);
    const ss = Math.floor((remainingMs % 60_000) / 1000);
    const formatted = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    const progress = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
    return { remainingMs, isExpired, formatted, progress };
}
