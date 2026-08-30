import { AlertTriangle, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

function format(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function AttemptTimer({ expiresAt, onExpire, onVisibilityWarning }: { expiresAt?: string | null; onExpire: () => void; onVisibilityWarning: () => void }) {
    const [seconds, setSeconds] = useState(() => expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0);
    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)));
        tick(); const interval = window.setInterval(tick, 1000);
        return () => window.clearInterval(interval);
    }, [expiresAt]);
    useEffect(() => { if (seconds === 0 && expiresAt) onExpire(); }, [expiresAt, onExpire, seconds]);
    useEffect(() => { const handler = () => { if (document.hidden) onVisibilityWarning(); }; document.addEventListener("visibilitychange", handler); return () => document.removeEventListener("visibilitychange", handler); }, [onVisibilityWarning]);
    return <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${seconds <= 60 ? "bg-red-50 text-red-600" : "bg-[#F47822]/10 text-[#F47822]"}`}><Clock3 className="h-4 w-4" />Time remaining: {format(seconds)}{seconds <= 60 && <AlertTriangle className="h-4 w-4" />}</div>;
}
