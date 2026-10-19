import { BookOpen, Award, Search, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { supportDeskApi, type DeskStudentListResponse } from "../api/supportDesk.api";

/**
 * Read-only student directory. Support answers "where is my certificate?"
 * and "why can't I access my course?" questions here instead of escalating.
 */
export function SupportStudentsPage() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [params, setParams] = useSearchParams();
    const [data, setData] = useState<DeskStudentListResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState(params.get("search") ?? "");

    const page = Number(params.get("page") ?? 1) || 1;

    useEffect(() => {
        let cancelled = false;
        setError(null);
        const needle = params.get("search") ?? "";
        void supportDeskApi
            .students(needle, page)
            .then((response) => {
                if (!cancelled) setData(response);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("supportDesk.students.loadFail"));
            });
        return () => {
            cancelled = true;
        };
    }, [params, page, t]);

    const set = (patch: Record<string, string | undefined>, resetPage = true) => {
        const next = new URLSearchParams(params);
        Object.entries(patch).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
        });
        if (resetPage) next.delete("page");
        setParams(next, { replace: true });
    };

    return (
        <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("supportDesk.students.eyebrow")}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{t("supportDesk.students.title")}</h1>
                <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">{t("supportDesk.students.description")}</p>
            </header>

            <label className="relative block">
                <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/30 dark:text-white/30 ${isRTL ? "right-3" : "left-3"}`} />
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") set({ search: search.trim() || undefined });
                    }}
                    placeholder={t("supportDesk.students.searchPh")}
                    aria-label={t("supportDesk.students.searchAria")}
                    className={`h-11 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] pr-3 text-sm outline-none focus:border-[#F47822] ${isRTL ? "pl-3 pr-9" : "pl-9"}`}
                />
            </label>

            {error && <p role="alert" className="rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

            {!data ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-2xl bg-white dark:bg-[#1b1b20]" />
                    ))}
                </div>
            ) : data.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-white dark:bg-[#1b1b20] p-10 text-center">
                    <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("supportDesk.students.emptyTitle")}</p>
                    <p className="mt-1 text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("supportDesk.students.emptyDesc")}</p>
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20]">
                        <ul>
                            {data.data.map((student) => (
                                <li key={student.id} className="border-b border-[#3A3A3A]/5 last:border-b-0">
                                    <Link to={`/support-desk/students/${student.id}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-[#F7F7F7] dark:hover:bg-white/5">
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{student.name}</span>
                                            <span dir="ltr" className="mt-0.5 block truncate text-xs text-[#3A3A3A]/45 dark:text-white/45 rtl:text-right">{student.email}</span>
                                        </span>
                                        <span className="hidden shrink-0 items-center gap-1 text-xs text-[#3A3A3A]/60 dark:text-white/60 sm:flex">
                                            <BookOpen className="h-3.5 w-3.5" /> {student.enrollments_count}
                                        </span>
                                        <span className="hidden shrink-0 items-center gap-1 text-xs text-[#3A3A3A]/60 dark:text-white/60 sm:flex">
                                            <Award className="h-3.5 w-3.5" /> {student.certificates_count}
                                        </span>
                                        <span className={`shrink-0 items-center gap-1 text-xs font-bold sm:flex ${student.open_tickets > 0 ? "flex text-[#F47822]" : "hidden text-[#3A3A3A]/40 dark:text-white/40"}`}>
                                            <Ticket className="h-3.5 w-3.5" /> {student.open_tickets}
                                        </span>
                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${student.status === "active" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-[#F7F7F7] dark:bg-[#101013] text-[#3A3A3A]/55 dark:text-white/55"}`}>
                                            {student.status ?? "—"}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#3A3A3A]/50 dark:text-white/50">
                        <span>{t("supportDesk.students.pageOf", { current: data.meta.current_page, last: data.meta.last_page, total: data.meta.total })}</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={data.meta.current_page <= 1}
                                onClick={() => set({ page: String(data.meta.current_page - 1) }, false)}
                                className="rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-4 py-2 font-bold disabled:opacity-40"
                            >
                                {t("supportDesk.students.previous")}
                            </button>
                            <button
                                type="button"
                                disabled={data.meta.current_page >= data.meta.last_page}
                                onClick={() => set({ page: String(data.meta.current_page + 1) }, false)}
                                className="rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-4 py-2 font-bold disabled:opacity-40"
                            >
                                {t("supportDesk.students.next")}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
