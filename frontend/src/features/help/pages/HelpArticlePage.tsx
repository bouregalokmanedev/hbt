import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronRight, Home, LifeBuoy, Send } from "lucide-react";

import { NotFound } from "@/components/feedback";

import {
    HELP_ARTICLES,
    HELP_CATEGORIES,
    localized,
} from "../data/articles";

export function HelpArticlePage() {
    const { slug = "" } = useParams();
    const { t, i18n } = useTranslation();
    const locale = i18n.language || "en";

    const article = useMemo(
        () => HELP_ARTICLES.find((entry) => entry.slug === slug),
        [slug],
    );

    const related = useMemo(() => {
        if (!article) return [];
        return HELP_ARTICLES.filter(
            (entry) => entry.category === article.category && entry.slug !== article.slug,
        ).slice(0, 3);
    }, [article]);

    if (!article) return <NotFound />;

    const category = HELP_CATEGORIES.find((entry) => entry.id === article.category);

    return (
        <div className="bg-white">
            <div className="border-b border-[#3A3A3A]/8 bg-[#FFF8F4]">
                <div className="mx-auto max-w-3xl px-5 py-8">
                    <nav
                        aria-label={t("navigation.breadcrumb")}
                        className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-[#3A3A3A]/50"
                    >
                        <Link to="/help" className="inline-flex items-center gap-1 hover:text-[#F47822]">
                            <Home className="h-3.5 w-3.5" />
                            {t("help.title")}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        <span>{category ? localized(category.label, locale) : article.category}</span>
                        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        <span className="text-[#3A3A3A]/80">{localized(article.title, locale)}</span>
                    </nav>

                    <h1 className="mt-4 text-2xl font-black tracking-tight text-[#3A3A3A] sm:text-3xl">
                        {localized(article.title, locale)}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/60">
                        {localized(article.summary, locale)}
                    </p>
                </div>
            </div>

            <article className="mx-auto max-w-3xl px-5 py-10">
                <div className="space-y-4">
                    {article.body.map((paragraph, index) => (
                        <p key={index} className="text-sm leading-7 text-[#3A3A3A]/75">
                            {localized(paragraph, locale)}
                        </p>
                    ))}
                </div>

                {article.steps && (
                    <ol className="mt-8 space-y-3">
                        {article.steps.map((step, index) => (
                            <li
                                key={index}
                                className="flex gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-[#FAFAFA] p-4"
                            >
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F47822] text-[11px] font-black text-white">
                                    {index + 1}
                                </span>
                                <p className="text-sm leading-6 text-[#3A3A3A]/75">
                                    {localized(step, locale)}
                                </p>
                            </li>
                        ))}
                    </ol>
                )}

                <div className="mt-8 flex flex-wrap gap-3 rounded-2xl border border-[#F47822]/20 bg-[#FFF8F4] p-5">
                    <p className="w-full text-xs font-bold text-[#3A3A3A]">
                        {t("help.stillStuck")}
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#E96D18]"
                    >
                        <Send className="h-4 w-4" />
                        {t("help.contactCta")}
                    </Link>
                    <Link
                        to="/help/track"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                    >
                        <LifeBuoy className="h-4 w-4" />
                        {t("help.trackCta")}
                    </Link>
                </div>

                {related.length > 0 && (
                    <section className="mt-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">
                            {t("help.related")}
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {related.map((entry) => (
                                <Link
                                    key={entry.slug}
                                    to={`/help/${entry.slug}`}
                                    className="group rounded-2xl border border-[#3A3A3A]/8 p-4 text-xs font-bold leading-5 text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                                >
                                    {localized(entry.title, locale)}
                                    <ArrowRight className="mt-2 h-3.5 w-3.5 text-[#F47822] transition group-hover:translate-x-0.5" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </div>
    );
}
