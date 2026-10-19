import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

interface LabBuilderCardProps {
    to: string;
    title: string;
    description: string;
    image: string;
    icon: LucideIcon;
    testId?: string;
}

export function LabBuilderCard({
    to,
    title,
    description,
    image,
    icon: Icon,
    testId,
}: LabBuilderCardProps) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === "rtl";
    return (
        <Link
            to={to}
            data-testid={testId}
            className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#3A3A3A]/12 bg-white shadow-[0_10px_28px_rgba(58,58,58,.07)] transition duration-300 hover:-translate-y-1 hover:border-[#F47822]/40 hover:shadow-[0_18px_40px_rgba(244,120,34,.14)] dark:border-white/10 dark:bg-[#1b1b20] dark:hover:border-[#F47822]/40"
        >
            <div className="relative h-36 w-full overflow-hidden sm:h-40">
                <img
                    src={image}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e]/70 via-[#1e1e1e]/10 to-transparent" />
                <div className="absolute bottom-3 start-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F47822] text-white shadow-[0_8px_18px_rgba(244,120,34,.35)] ring-4 ring-white/20 dark:ring-[#1b1b20]/40">
                    <Icon className="h-5 w-5" aria-hidden />
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="text-[15px] font-black leading-snug tracking-tight text-[#2E2E2E] dark:text-[#ececef]">
                    {title}
                </h3>
                <p className="text-xs leading-5 text-[#3A3A3A]/60 dark:text-white/55">{description}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-[11px] font-black uppercase tracking-[.14em] text-[#F47822]">
                    {t("instructor.simulator.labBuilders.open")}
                    {isRtl ? (
                        <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" aria-hidden />
                    ) : (
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                    )}
                </span>
            </div>
        </Link>
    );
}
