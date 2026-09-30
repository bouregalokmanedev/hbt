import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    ArrowUpRight,
    BarChart3,
    Cookie,
    Lock,
    Megaphone,
    Settings2,
    ShieldCheck,
    SlidersHorizontal,
    X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";

import {
    OPEN_COOKIE_CONSENT_EVENT,
    readConsent,
    writeConsent,
} from "./consent";

interface Draft {
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
}

type CategoryKey = "necessary" | "preferences" | "analytics" | "marketing";

const CATEGORIES: { key: CategoryKey; icon: LucideIcon; locked?: boolean }[] = [
    { key: "necessary", icon: Lock, locked: true },
    { key: "preferences", icon: Settings2 },
    { key: "analytics", icon: BarChart3 },
    { key: "marketing", icon: Megaphone },
];

function Switch({
    checked,
    disabled = false,
    onChange,
    label,
}: {
    checked: boolean;
    disabled?: boolean;
    onChange: (next: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#121216]",
                "disabled:cursor-not-allowed",
                checked
                    ? "bg-[#F47822] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]"
                    : "bg-[#3A3A3A]/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] dark:bg-white/15",
            )}
        >
            <span
                className={cn(
                    "absolute start-0 top-[3px] h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    checked
                        ? "translate-x-[23px] rtl:-translate-x-[23px]"
                        : "translate-x-[3px] rtl:-translate-x-[3px]",
                )}
            />
        </button>
    );
}

function CategoryRow({
    category,
    checked,
    onChange,
}: {
    category: (typeof CATEGORIES)[number];
    checked: boolean;
    onChange: (next: boolean) => void;
}) {
    const { t } = useTranslation();
    const Icon = category.icon;

    return (
        <div className="flex items-center gap-3 py-3">
            <span
                className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl border transition-colors",
                    checked
                        ? "border-[#F47822]/25 bg-[#F47822]/10 text-[#F47822]"
                        : "border-[#3A3A3A]/10 bg-[#3A3A3A]/[0.04] text-[#3A3A3A]/45 dark:border-white/10 dark:bg-white/5 dark:text-white/40",
                )}
            >
                <Icon className="size-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-tight text-[#3A3A3A] dark:text-white">
                    {t(`cookieConsent.${category.key}`)}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-[#3A3A3A]/55 dark:text-white/50">
                    {t(`cookieConsent.${category.key}Hint`)}
                </p>
            </div>

            {category.locked ? (
                <span className="shrink-0 rounded-full border border-[#16a34a]/25 bg-[#16a34a]/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#16a34a]">
                    {t("cookieConsent.alwaysOn")}
                </span>
            ) : (
                <Switch
                    checked={checked}
                    onChange={onChange}
                    label={t(`cookieConsent.${category.key}`)}
                />
            )}
        </div>
    );
}

export function CookieConsentBanner() {
    const { t } = useTranslation();
    const reduce = useReducedMotion();

    const [visible, setVisible] = useState(false);
    const [managing, setManaging] = useState(false);
    const [draft, setDraft] = useState<Draft>({
        preferences: true,
        analytics: true,
        marketing: false,
    });

    useEffect(() => {
        const show = () => {
            const stored = readConsent();
            setDraft({
                preferences: stored?.preferences ?? true,
                analytics: stored?.analytics ?? true,
                marketing: stored?.marketing ?? false,
            });
            setManaging(false);
            setVisible(true);
        };

        // First visit: no stored decision yet.
        if (!readConsent()) show();

        window.addEventListener(OPEN_COOKIE_CONSENT_EVENT, show);
        return () =>
            window.removeEventListener(OPEN_COOKIE_CONSENT_EVENT, show);
    }, []);

    const save = (next: Draft) => {
        writeConsent(next);
        setVisible(false);
        setManaging(false);
    };

    const acceptAll = () =>
        save({ preferences: true, analytics: true, marketing: true });
    const rejectAll = () =>
        save({ preferences: false, analytics: false, marketing: false });

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="cookie-consent"
                    className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 sm:justify-end sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.25 }}
                >
                    <motion.section
                        role="region"
                        aria-label={t("cookieConsent.title")}
                        className="pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-[420px] overflow-y-auto rounded-[26px] border border-white/70 bg-white/90 shadow-[0_28px_80px_-24px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#121216]/92"
                        initial={
                            reduce
                                ? { opacity: 0 }
                                : { opacity: 0, y: 32, scale: 0.97 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                            reduce
                                ? { opacity: 0 }
                                : { opacity: 0, y: 24, scale: 0.98 }
                        }
                        transition={
                            reduce
                                ? { duration: 0 }
                                : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
                        }
                    >
                        {/* Brand hairline */}
                        <div
                            aria-hidden="true"
                            className="h-[3px] w-full bg-gradient-to-r from-[#F47822] via-[#FF9F45] to-transparent"
                        />

                        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                            <div className="flex items-start gap-3.5">
                                <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#F47822] to-[#FF9A4D] text-white shadow-[0_10px_24px_-10px_rgba(244,120,34,0.9)]">
                                    <span
                                        aria-hidden="true"
                                        className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-white bg-[#16a34a] dark:border-[#121216]"
                                    />
                                    <Cookie
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#F47822]">
                                        <span className="relative flex size-1.5">
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#F47822] opacity-70" />
                                            <span className="relative inline-flex size-1.5 rounded-full bg-[#F47822]" />
                                        </span>
                                        {t("cookieConsent.badge")}
                                    </p>
                                    <h2 className="mt-1.5 text-[17px] font-extrabold leading-snug tracking-tight text-[#222] dark:text-white">
                                        {t("cookieConsent.title")}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={rejectAll}
                                    aria-label={t("cookieConsent.reject")}
                                    className="-me-1 -mt-1 rounded-full p-2 text-[#3A3A3A]/35 transition hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A] dark:text-white/35 dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                    <X className="size-[18px]" aria-hidden="true" />
                                </button>
                            </div>

                            <p className="mt-3.5 text-[13px] leading-[1.7] text-[#3A3A3A]/70 dark:text-white/65">
                                {t("cookieConsent.description")}
                            </p>

                            {/* Expandable preferences */}
                            <AnimatePresence initial={false}>
                                {managing && (
                                    <motion.div
                                        key="prefs"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={
                                            reduce
                                                ? { duration: 0 }
                                                : {
                                                      duration: 0.35,
                                                      ease: [
                                                          0.16,
                                                          1,
                                                          0.3,
                                                          1,
                                                      ],
                                                  }
                                        }
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 divide-y divide-[#3A3A3A]/[0.07] overflow-hidden rounded-2xl border border-[#3A3A3A]/[0.08] bg-[#3A3A3A]/[0.025] px-3.5 dark:divide-white/[0.07] dark:border-white/10 dark:bg-white/[0.03]">
                                            {CATEGORIES.map((category) => (
                                                <CategoryRow
                                                    key={category.key}
                                                    category={category}
                                                    checked={
                                                        category.locked
                                                            ? true
                                                            : draft[
                                                                  category.key as keyof Draft
                                                              ]
                                                    }
                                                    onChange={(next) =>
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            [category.key as keyof Draft]:
                                                                next,
                                                        }))
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Trust strip */}
                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#3A3A3A]/[0.07] pt-3.5 dark:border-white/[0.08]">
                                <p className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/45 dark:text-white/40">
                                    <ShieldCheck
                                        className="size-3.5 text-[#16a34a]"
                                        aria-hidden="true"
                                    />
                                    {t("cookieConsent.trust")}
                                </p>
                                <a
                                    href="/cookies"
                                    className="group/link flex shrink-0 items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#F47822] hover:underline"
                                >
                                    {t("cookieConsent.policyLink")}
                                    <ArrowUpRight
                                        className="size-3 transition-transform group-hover/link:-translate-y-0.5 rtl:-scale-x-100"
                                        aria-hidden="true"
                                    />
                                </a>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                            <button
                                type="button"
                                onClick={() => setManaging((prev) => !prev)}
                                aria-expanded={managing}
                                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#3A3A3A]/10 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/60 transition hover:border-[#F47822]/30 hover:bg-[#F47822]/[0.06] hover:text-[#F47822] dark:border-white/10 dark:text-white/55 dark:hover:border-[#F47822]/35 dark:hover:text-[#F47822]"
                            >
                                <SlidersHorizontal
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                {managing
                                    ? t("cookieConsent.hidePreferences")
                                    : t("cookieConsent.manage")}
                            </button>

                            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                                {managing ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setManaging(false)}
                                            className="rounded-full border border-[#3A3A3A]/10 py-3 text-[13px] font-bold text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            {t("cookieConsent.cancel")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => save(draft)}
                                            className="group/save relative overflow-hidden rounded-full bg-[#F47822] py-3 text-[13px] font-bold text-white shadow-[0_14px_32px_-12px_rgba(244,120,34,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#df6817] hover:shadow-[0_18px_40px_-12px_rgba(244,120,34,0.95)] active:translate-y-0"
                                        >
                                            <span className="absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-white/20 transition-all duration-700 group-hover/save:left-[120%]" />
                                            <span className="relative">
                                                {t("cookieConsent.save")}
                                            </span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={rejectAll}
                                            className="rounded-full border border-[#3A3A3A]/10 py-3 text-[13px] font-bold text-[#3A3A3A]/60 transition hover:border-[#3A3A3A]/20 hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/55 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            {t("cookieConsent.reject")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={acceptAll}
                                            className="group/accept relative overflow-hidden rounded-full bg-[#F47822] py-3 text-[13px] font-bold text-white shadow-[0_14px_32px_-12px_rgba(244,120,34,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#df6817] hover:shadow-[0_18px_40px_-12px_rgba(244,120,34,0.95)] active:translate-y-0"
                                        >
                                            <span className="absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-white/20 transition-all duration-700 group-hover/accept:left-[120%]" />
                                            <span className="relative">
                                                {t("cookieConsent.acceptAll")}
                                            </span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.section>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
