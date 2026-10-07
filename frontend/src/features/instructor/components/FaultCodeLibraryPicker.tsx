import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import {
    searchFaultCodes,
    type FaultCodeEntry,
} from "../data/faultCodeLibrary";

/**
 * Popover picker for the scanner fault-variant builder: instructors either
 * type a fault code by hand in the row input, or pick one from the curated
 * library. Selection hands the entry back to the caller, which prefills a
 * new DTC row.
 */
export function FaultCodeLibraryPicker({
    onPick,
}: {
    onPick: (entry: FaultCodeEntry) => void;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const results = useMemo(() => searchFaultCodes(query, 40), [query]);

    const pick = (entry: FaultCodeEntry) => {
        onPick(entry);
        setQuery("");
        setOpen(false);
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-lg border border-[#3A3A3A]/20 bg-white px-3 py-1.5 text-[11px] font-black text-[#3A3A3A] hover:border-[#F47822]/50 hover:text-[#F47822]"
            >
                {t("instructor.simulator.packForm.codeLibraryOpen")}
            </button>
        );
    }

    return (
        <div className="absolute end-0 top-full z-20 mt-1 w-[min(380px,90vw)] rounded-xl border border-[#3A3A3A]/15 bg-white p-2 shadow-xl">
            <div className="flex items-center gap-2">
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("instructor.simulator.packForm.codeLibrarySearch")}
                    aria-label={t("instructor.simulator.packForm.codeLibrarySearch")}
                    dir="ltr"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-[#3A3A3A]/10 bg-[#FCFCFC] px-2.5 font-mono text-xs"
                />
                <button
                    type="button"
                    aria-label={t("instructor.simulator.packForm.codeLibraryClose")}
                    onClick={() => {
                        setOpen(false);
                        setQuery("");
                    }}
                    className="rounded-lg px-2.5 py-2 text-[11px] font-black text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/[.05] hover:text-[#3A3A3A]"
                >
                    ✕
                </button>
            </div>

            <ul className="mt-2 max-h-56 overflow-y-auto">
                {results.length === 0 ? (
                    <li className="px-2 py-3 text-center text-[11px] text-[#3A3A3A]/50">
                        {t("instructor.simulator.packForm.codeLibraryEmpty")}
                    </li>
                ) : (
                    results.map((entry) => (
                        <li key={entry.code}>
                            <button
                                type="button"
                                onClick={() => pick(entry)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition hover:bg-[#F47822]/[.07]"
                            >
                                <span
                                    dir="ltr"
                                    className="shrink-0 font-mono text-xs font-bold text-[#3A3A3A]"
                                >
                                    {entry.code}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[11px] text-[#3A3A3A]/70">
                                    {entry.desc}
                                </span>
                                <span
                                    dir="ltr"
                                    className="shrink-0 rounded bg-[#3A3A3A]/[.06] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#3A3A3A]/55"
                                >
                                    {entry.ecu}
                                </span>
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
