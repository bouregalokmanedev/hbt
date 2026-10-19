import { ChevronLeft, Construction, FileText, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

function PlaceholderShell({
    cardKey,
    icon: Icon,
}: {
    cardKey: "reports" | "settings";
    icon: LucideIcon;
}) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === "rtl";

    return (
        <main
            className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6"
            data-testid={`scanner-lab-${cardKey}-page`}
        >
            <div className="mx-auto max-w-[720px] space-y-5">
                <Link
                    to="/instructor/simulator/scanner"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#3A3A3A]/12 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/60 shadow-sm transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:bg-[#1b1b20] dark:text-white/60"
                >
                    {isRtl ? null : <ChevronLeft className="h-3.5 w-3.5" aria-hidden />}
                    <span>{t("instructor.simulator.scannerLab.backToHub")}</span>
                    {isRtl ? <ChevronLeft className="h-3.5 w-3.5 rotate-180" aria-hidden /> : null}
                </Link>

                <section className="relative overflow-hidden rounded-[28px] border border-[#F47822]/20 bg-white p-8 text-center shadow-[0_14px_36px_rgba(58,58,58,.08)] dark:border-[#F47822]/25 dark:bg-[#1b1b20] sm:p-12">
                    <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F47822]/10 blur-3xl" />
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#F47822] to-[#ff8f45] text-white shadow-[0_12px_28px_rgba(244,120,34,.3)]">
                        <Icon className="h-7 w-7" aria-hidden />
                    </div>
                    <h1 className="relative mt-5 text-xl font-black tracking-tight text-[#2E2E2E] dark:text-[#ececef] sm:text-2xl">
                        {t(`instructor.simulator.scannerLab.cards.${cardKey}.title`)}
                    </h1>
                    <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/55">
                        {t(`instructor.simulator.scannerLab.cards.${cardKey}.desc`)}
                    </p>
                    <p
                        role="status"
                        className="relative mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl border border-dashed border-[#F47822]/35 bg-[#F47822]/[.07] px-4 py-2.5 text-xs font-black text-[#F47822]"
                    >
                        <Construction className="h-4 w-4" aria-hidden />
                        {t("instructor.simulator.scannerLab.comingSoon.title")}
                    </p>
                    <p className="relative mx-auto mt-3 max-w-md text-xs leading-5 text-[#3A3A3A]/45 dark:text-white/40">
                        {t("instructor.simulator.scannerLab.comingSoon.desc")}
                    </p>
                </section>
            </div>
        </main>
    );
}

export function StudentReportsBuilderPage() {
    return <PlaceholderShell cardKey="reports" icon={FileText} />;
}

export function ScannerLabSettingsPage() {
    return <PlaceholderShell cardKey="settings" icon={Settings} />;
}
