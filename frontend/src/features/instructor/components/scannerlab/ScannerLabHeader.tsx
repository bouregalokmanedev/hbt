import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export interface HeaderStat {
    label: string;
    value: string | number;
}

interface ScannerLabHeaderProps {
    testId?: string;
    /** Parent page the back pill returns to. */
    to: string;
    backLabel: string;
    /** Ancestor labels shown before the back pill, most distant first. */
    crumbs?: string[];
    icon: LucideIcon;
    eyebrow: string;
    title: string;
    description: string;
    stats?: HeaderStat[];
}

export function ScannerLabHeader({
    testId,
    to,
    backLabel,
    crumbs = [],
    icon: Icon,
    eyebrow,
    title,
    description,
    stats,
}: ScannerLabHeaderProps) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === "rtl";

    return (
        <header
            data-testid={testId}
            className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#1c1d22] text-white shadow-[0_22px_48px_rgba(20,20,24,.26)] dark:bg-[#17171b]"
        >
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div
                    className="absolute inset-0 opacity-60"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
                        backgroundSize: "46px 46px",
                    }}
                />
                <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#F47822]/22 blur-3xl" />
                <div className="absolute -bottom-24 left-1/4 h-44 w-44 rounded-full bg-[#8B5CF6]/12 blur-3xl" />
            </div>

            <div className="relative px-5 py-6 sm:px-7 sm:py-7">
                <nav aria-label={t("instructor.simulator.scannerLab.header.breadcrumb")} className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {crumbs.map((crumb) => (
                        <Fragment key={crumb}>
                            <span className="text-[11px] font-bold text-white/40">{crumb}</span>
                            {isRtl ? (
                                <ChevronLeft className="h-3.5 w-3.5 text-white/25" aria-hidden />
                            ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-white/25" aria-hidden />
                            )}
                        </Fragment>
                    ))}
                    <Link
                        to={to}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[.07] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] text-white/65 transition hover:border-[#F47822]/50 hover:bg-[#F47822]/15 hover:text-[#F9A16C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/50"
                    >
                        {isRtl ? null : <ChevronLeft className="h-3.5 w-3.5" aria-hidden />}
                        <span>{backLabel}</span>
                        {isRtl ? <ChevronLeft className="h-3.5 w-3.5 rotate-180" aria-hidden /> : null}
                    </Link>
                </nav>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#F47822] to-[#ff9d5c] text-white shadow-[0_10px_24px_rgba(244,120,34,.38)] ring-1 ring-white/20 sm:h-14 sm:w-14">
                            <Icon className="h-6 w-6" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#F9A16C]">{eyebrow}</p>
                            <h1 className="mt-1.5 text-[1.5rem] font-black leading-[1.15] tracking-tight sm:text-3xl">{title}</h1>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{description}</p>
                        </div>
                    </div>

                    {stats && stats.length > 0 ? (
                        <div className="flex flex-wrap gap-2 sm:shrink-0">
                            {stats.map((stat) => (
                                <div key={stat.label} className="min-w-[88px] rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3">
                                    <p className="text-lg font-black leading-none text-white">{stat.value}</p>
                                    <p className="mt-1.5 text-[10px] font-black uppercase tracking-[.14em] text-white/45">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#F47822] via-[#F47822]/45 to-transparent" />
        </header>
    );
}
