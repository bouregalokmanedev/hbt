import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, Gauge } from "lucide-react";

import { simulatorApi, type SimulatorResult } from "../api/simulator.api";

const TOOL_LABEL: Record<string, string> = {
    scanner: "Scanner",
    multimeter: "Multimeter",
    oscilloscope: "Oscilloscope",
    location: "Location",
    schematic: "Schematic",
};

export function SimulatorReportsPage() {
    const [results, setResults] = useState<SimulatorResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void simulatorApi
            .results()
            .then(setResults)
            .catch((cause: unknown) =>
                setError(cause instanceof Error ? cause.message : "Unable to load reports."),
            );
    }, []);

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013]">
            <div className="mx-auto max-w-[1100px] px-5 py-6 sm:px-8">
                <Link to="/simulator" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3A3A3A]/50 dark:text-white/50 hover:text-[#3A3A3A] dark:hover:text-[#ececef]">
                    <ArrowLeft className="h-4 w-4" /> Back to labs
                </Link>
                <div className="mt-4 rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-sm sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#3A3A3A] text-white">
                            <ClipboardCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">Bench reports</h1>
                            <p className="text-xs font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                                Persisted via POST /v1/simulator/sessions
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="mt-5 rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    {results === null && !error && (
                        <p className="mt-5 text-sm text-[#3A3A3A]/50 dark:text-white/50">Loading your bench history…</p>
                    )}

                    {results !== null && results.length === 0 && (
                        <div className="mt-5 rounded-2xl bg-[#F8F7F6] dark:bg-[#101013] p-8 text-center">
                            <Gauge className="mx-auto h-8 w-8 text-[#3A3A3A]/20 dark:text-white/20" />
                            <p className="mt-3 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">No bench sessions recorded yet</p>
                            <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                                Open any lab — a backend session starts automatically and completions land here.
                            </p>
                            <Link to="/simulator" className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#F47822] px-4 py-2 text-sm font-bold text-white">
                                Open labs
                            </Link>
                        </div>
                    )}

                    {results !== null && results.length > 0 && (
                        <ul className="mt-5 divide-y divide-[#3A3A3A]/8 dark:divide-white/8">
                            {results.map((result) => (
                                <li key={result.id} className="flex items-center gap-4 py-3.5">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-xs font-black text-[#F47822]">
                                        {(TOOL_LABEL[result.tool] ?? result.tool).slice(0, 3).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                            {TOOL_LABEL[result.tool] ?? result.tool}
                                            {result.verdict ? ` — ${result.verdict}` : ""}
                                        </p>
                                        <p className="text-xs text-[#3A3A3A]/45 dark:text-white/45">
                                            Score {result.score} · {result.outcome ?? "completed"}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                            result.score >= 70
                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                        }`}
                                    >
                                        {result.score}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </main>
    );
}
