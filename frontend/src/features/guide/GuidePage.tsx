import { ArrowRight, Check, ChevronDown, Minus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { GuideChapter, GuideContent, GuideText } from "./content";

function pick(text: GuideText, arabic: boolean): string {
    return arabic ? text.ar : text.en;
}

export function GuidePage({ content, extraChapter }: { content: GuideContent; extraChapter?: GuideChapter | null }) {
    const { i18n } = useTranslation();
    const arabic = (i18n.language ?? "en").toLowerCase().startsWith("ar");
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const chapters = extraChapter ? [...content.chapters, extraChapter] : content.chapters;

    return (
        <main className="min-h-full">
            <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
                <header className="overflow-hidden rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white sm:px-8">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {pick(content.badge, arabic)}
                    </p>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{pick(content.title, arabic)}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{pick(content.description, arabic)}</p>
                </header>

                <section className="mt-6 rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                    <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{pick(content.rightsTitle, arabic)}</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-emerald-50/70 p-4">
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{pick(content.canTitle, arabic)}</p>
                            <ul className="mt-2 space-y-2">
                                {content.can.map((item) => (
                                    <li key={item.en} className="flex gap-2 text-xs leading-5 text-[#3A3A3A]/70 dark:text-white/70">
                                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        {pick(item, arabic)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl bg-red-50/70 p-4">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400">{pick(content.cantTitle, arabic)}</p>
                            <ul className="mt-2 space-y-2">
                                {content.cant.map((item) => (
                                    <li key={item.en} className="flex gap-2 text-xs leading-5 text-[#3A3A3A]/70 dark:text-white/70">
                                        <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                                        {pick(item, arabic)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <h2 className="mb-4 mt-8 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{pick(content.chaptersTitle, arabic)}</h2>
                <div className="space-y-4">
                    {chapters.map((chapter, index) => (
                        <article key={chapter.title.en} className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                            <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F47822] text-xs font-black text-white">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <h3 className="text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">{pick(chapter.title, arabic)}</h3>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">{pick(chapter.body, arabic)}</p>
                            <ul className="mt-4 space-y-2">
                                {chapter.steps.map((step) => (
                                    <li key={step.en} className="flex gap-2.5 rounded-xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-2.5 text-xs leading-5 text-[#3A3A3A]/70 dark:text-white/70">
                                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822] rtl:rotate-180" />
                                        {pick(step, arabic)}
                                    </li>
                                ))}
                            </ul>
                            {chapter.links.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {chapter.links.map((link) => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#F47822]"
                                        >
                                            {pick(link.label, arabic)}
                                            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                </div>

                <h2 className="mb-4 mt-8 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{pick(content.faqTitle, arabic)}</h2>
                <div className="space-y-3">
                    {content.faqs.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <div key={faq.q.en} className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20]">
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(isOpen ? null : index)}
                                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                                >
                                    <span className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{pick(faq.q, arabic)}</span>
                                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#3A3A3A]/40 dark:text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                </button>
                                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                    <div className="overflow-hidden">
                                        <p className="border-t border-[#3A3A3A]/6 dark:border-white/6 px-5 py-4 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">
                                            {pick(faq.a, arabic)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
