import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Headset,
    LifeBuoy,
    Search,
    Send,
    TicketCheck,
    X,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import {
    localized,
    searchArticles,
} from "@/features/help/data/articles";

/**
 * Floating help launcher available on public and student surfaces.
 *
 * Deliberately lightweight: it never fetches anything on mount — the knowledge
 * base is bundled, so the widget opens instantly even on a slow connection.
 */
export function HelpWidget() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || "en";
    const { user } = useAuth();
    const location = useLocation();

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const panelRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const results = useMemo(() => searchArticles(query, locale, 4), [query, locale]);

    // Any navigation dismisses the panel so it never covers the new screen.
    useEffect(() => setOpen(false), [location.pathname]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [open]);

    return (
        <div className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3">
            {open && (
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-label={t("help.widget.title")}
                    className="w-[min(20rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#3A3A3A]/10 bg-white shadow-[0_18px_50px_rgba(58,58,58,0.22)]"
                >
                    <div className="flex items-center justify-between bg-[#F47822] px-4 py-3">
                        <div className="flex items-center gap-2 text-white">
                            <LifeBuoy className="h-4 w-4" />
                            <p className="text-xs font-bold">{t("help.widget.title")}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label={t("help.widget.close")}
                            className="rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="relative">
                            <Search
                                aria-hidden
                                className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3A3A3A]/40"
                            />
                            <input
                                autoFocus
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={t("help.widget.searchPh")}
                                aria-label={t("help.widget.searchPh")}
                                className="h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] ps-9 pe-3 text-xs outline-none transition focus:border-[#F47822] focus:bg-white"
                            />
                        </div>

                        {query.trim() ? (
                            <ul className="mt-3 space-y-1.5">
                                {results.map((article) => (
                                    <li key={article.slug}>
                                        <Link
                                            to={`/help/${article.slug}`}
                                            className="flex items-center justify-between gap-2 rounded-xl border border-[#3A3A3A]/8 px-3 py-2.5 text-[11px] font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                                        >
                                            <span className="line-clamp-2">
                                                {localized(article.title, locale)}
                                            </span>
                                            <ArrowRight className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" />
                                        </Link>
                                    </li>
                                ))}
                                {results.length === 0 && (
                                    <li className="rounded-xl bg-[#FAFAFA] px-3 py-2.5 text-[11px] text-[#3A3A3A]/55">
                                        {t("help.widget.noResults")}
                                    </li>
                                )}
                            </ul>
                        ) : (
                            <ul className="mt-3 space-y-1.5">
                                <WidgetLink to="/help" icon={<LifeBuoy className="h-4 w-4" />}>
                                    {t("help.title")}
                                </WidgetLink>
                                <WidgetLink to="/help/track" icon={<TicketCheck className="h-4 w-4" />}>
                                    {t("help.trackCta")}
                                </WidgetLink>
                                <WidgetLink to="/contact" icon={<Headset className="h-4 w-4" />}>
                                    {t("help.contactCta")}
                                </WidgetLink>
                                <WidgetLink
                                    to={user ? "/support" : "/login?redirect=/support"}
                                    icon={<Send className="h-4 w-4" />}
                                >
                                    {user ? t("help.widget.myTickets") : t("help.openTicketCta")}
                                </WidgetLink>
                            </ul>
                        )}
                    </div>
                </div>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-label={t("help.widget.open")}
                className="flex h-13 w-13 items-center justify-center rounded-full bg-[#F47822] text-white shadow-[0_10px_30px_rgba(244,120,34,0.4)] transition hover:scale-105 hover:bg-[#E96D18] focus:outline-none focus:ring-4 focus:ring-[#F47822]/25"
            >
                {open ? <X className="h-5 w-5" /> : <LifeBuoy className="h-6 w-6" />}
            </button>
        </div>
    );
}

function WidgetLink({
    to,
    icon,
    children,
}: {
    to: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <li>
            <Link
                to={to}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-[#3A3A3A] transition hover:bg-[#FFF8F4] hover:text-[#F47822]"
            >
                <span className="text-[#F47822]">{icon}</span>
                {children}
            </Link>
        </li>
    );
}
