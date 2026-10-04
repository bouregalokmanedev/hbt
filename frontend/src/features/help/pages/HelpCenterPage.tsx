import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
    ArrowRight,
    BadgeCheck,
    Headset,
    LifeBuoy,
    Search,
    Send,
    TicketCheck,
} from "lucide-react";

import {
    HELP_ARTICLES,
    HELP_CATEGORIES,
    localized,
    searchArticles,
    type HelpCategoryId,
} from "../data/articles";

export function HelpCenterPage() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || "en";
    const { user } = useAuth();

    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<HelpCategoryId | "all">("all");

    const results = useMemo(() => searchArticles(query, locale), [query, locale]);

    const visible = useMemo(() => {
        if (query.trim()) return results;
        return category === "all"
            ? HELP_ARTICLES
            : HELP_ARTICLES.filter((article) => article.category === category);
    }, [query, results, category]);

    return (
        <div className="bg-white">
            <section className="border-b border-[#3A3A3A]/8 bg-gradient-to-b from-[#FFF8F4] to-white">
                <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                        {t("help.eyebrow")}
                    </p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-[#3A3A3A] sm:text-4xl">
                        {t("help.title")}
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#3A3A3A]/60">
                        {t("help.subtitle")}
                    </p>

                    <div className="relative mx-auto mt-8 max-w-xl">
                        <Search
                            aria-hidden
                            className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/40"
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t("help.searchPh")}
                            aria-label={t("help.searchPh")}
                            className="h-13 w-full rounded-2xl border border-[#3A3A3A]/10 bg-white ps-11 pe-4 text-sm text-[#3A3A3A] shadow-sm outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10"
                        />
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            to="/help/track"
                            className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                        >
                            <TicketCheck className="h-4 w-4" />
                            {t("help.trackCta")}
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                        >
                            <Headset className="h-4 w-4" />
                            {t("help.contactCta")}
                        </Link>
                        <Link
                            to={user ? "/support" : "/login?redirect=/support"}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#E96D18]"
                        >
                            <Send className="h-4 w-4" />
                            {t("help.openTicketCta")}
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-5 py-12">
                {query.trim() ? (
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">
                            {t("help.resultsCount", { count: results.length })}
                        </p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {results.map((article) => (
                                <ArticleCard key={article.slug} slug={article.slug} />
                            ))}
                        </div>
                        {results.length === 0 && (
                            <div className="mt-5 rounded-2xl border border-dashed border-[#3A3A3A]/15 p-8 text-center">
                                <LifeBuoy className="mx-auto h-8 w-8 text-[#F47822]" />
                                <p className="mt-4 text-sm font-bold text-[#3A3A3A]">
                                    {t("help.noResults")}
                                </p>
                                <p className="mt-1 text-xs text-[#3A3A3A]/55">
                                    {t("help.noResultsHint")}
                                </p>
                                <div className="mt-5 flex flex-wrap justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setQuery("")}
                                        className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                                    >
                                        {t("help.clearSearch")}
                                    </button>
                                    <Link
                                        to="/contact"
                                        className="rounded-xl bg-[#F47822] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#E96D18]"
                                    >
                                        {t("help.contactCta")}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("help.categoriesLabel")}>
                            <CategoryChip
                                active={category === "all"}
                                onClick={() => setCategory("all")}
                                label={t("help.allArticles")}
                            />
                            {HELP_CATEGORIES.map((entry) => (
                                <CategoryChip
                                    key={entry.id}
                                    active={category === entry.id}
                                    onClick={() => setCategory(entry.id)}
                                    label={localized(entry.label, locale)}
                                />
                            ))}
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {visible.map((article) => (
                                <ArticleCard key={article.slug} slug={article.slug} />
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <section className="border-t border-[#3A3A3A]/8 bg-[#F7F7F7]">
                <div className="mx-auto grid max-w-5xl gap-4 px-5 py-12 sm:grid-cols-3">
                    <HelpTile
                        icon={<BadgeCheck className="h-5 w-5 text-[#F47822]" />}
                        title={t("help.tileVerify.title")}
                        body={t("help.tileVerify.body")}
                        to="/verify-certificate"
                        link={t("help.tileVerify.link")}
                    />
                    <HelpTile
                        icon={<TicketCheck className="h-5 w-5 text-[#F47822]" />}
                        title={t("help.tileTrack.title")}
                        body={t("help.tileTrack.body")}
                        to="/help/track"
                        link={t("help.trackCta")}
                    />
                    <HelpTile
                        icon={<Headset className="h-5 w-5 text-[#F47822]" />}
                        title={t("help.tileContact.title")}
                        body={t("help.tileContact.body")}
                        to="/contact"
                        link={t("help.contactCta")}
                    />
                </div>
            </section>
        </div>
    );
}

function CategoryChip({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                active
                    ? "border-[#F47822] bg-[#F47822] text-white"
                    : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/70 hover:border-[#F47822]/40 hover:text-[#F47822]"
            }`}
        >
            {label}
        </button>
    );
}

function ArticleCard({ slug }: { slug: string }) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || "en";
    const article = HELP_ARTICLES.find((entry) => entry.slug === slug);
    if (!article) return null;

    return (
        <Link
            to={`/help/${article.slug}`}
            className="group flex flex-col rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F47822]/40 hover:shadow-md"
        >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                {localized(
                    HELP_CATEGORIES.find((entry) => entry.id === article.category)?.label ?? {
                        en: article.category,
                        ar: article.category,
                    },
                    locale,
                )}
            </p>
            <h3 className="mt-2 text-sm font-bold leading-5 text-[#3A3A3A] group-hover:text-[#F47822]">
                {localized(article.title, locale)}
            </h3>
            <p className="mt-2 flex-1 text-xs leading-5 text-[#3A3A3A]/55">
                {localized(article.summary, locale)}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-[#F47822]">
                {t("help.readArticle")}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
        </Link>
    );
}

function HelpTile({
    icon,
    title,
    body,
    to,
    link,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
    to: string;
    link: string;
}) {
    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5">
            <div className="flex items-center gap-2">
                {icon}
                <p className="text-sm font-bold text-[#3A3A3A]">{title}</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#3A3A3A]/55">{body}</p>
            <Link
                to={to}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#F47822] hover:underline"
            >
                {link}
                <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    );
}
