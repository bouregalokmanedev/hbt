import { CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { AttemptStep, DiagnosticHint } from "../types/diagnostic.types";

export function StepNavigator({
    steps,
    currentId,
    onSelect,
}: {
    steps: AttemptStep[];
    currentId: string | null;
    onSelect: (stepId: string) => void;
}) {
    const { t } = useTranslation();
    return (
        <nav aria-label={t("diagnostics.hints.stepsAria")} className="rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-4">
            <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.hints.stepsTitle")}</p>
            <ol className="mt-2 space-y-1">
                {steps.map((step, index) => {
                    const active = step.id === currentId;

                    return (
                        <li key={step.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(step.id)}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                    active ? "bg-[#3A3A3A] font-semibold text-white" : "text-[#3A3A3A]/70 dark:text-white/70 hover:bg-[#F7F7F7] dark:hover:bg-[#101013]"
                                }`}
                            >
                                {step.answered ? (
                                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${active ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                                ) : (
                                    <Circle className="h-4 w-4 shrink-0 opacity-40" />
                                )}
                                <span className="truncate">
                                    {index + 1}. {step.title}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export function HintsPanel({
    hints,
    remaining,
    penaltyTotal,
    disabled,
    onUse,
}: {
    hints: DiagnosticHint[];
    remaining: number;
    penaltyTotal: number;
    disabled: boolean;
    onUse: (hintId: string) => void;
}) {
    const { t } = useTranslation();
    return (
        <section className="rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-4">
            <div className="flex items-center justify-between px-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                    {t("diagnostics.hints.title")} · {remaining} {t("diagnostics.hints.left")}
                </p>
                {penaltyTotal > 0 ? (
                    <span className="text-[11px] font-bold text-[#F47822]">−{penaltyTotal} {t("diagnostics.hints.pts")}</span>
                ) : null}
            </div>

            <div className="mt-2 space-y-2">
                {hints.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("diagnostics.hints.empty")}</p>
                ) : (
                    hints.map((hint) => (
                        <div key={hint.id} className="rounded-xl bg-[#F7F7F7] dark:bg-[#101013] p-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                    <Lightbulb className="h-3.5 w-3.5 text-[#F47822]" />
                                    {hint.title ?? t("diagnostics.hints.levelHint", { level: hint.level })}
                                </p>
                                <span className="text-[10px] font-semibold text-[#3A3A3A]/40 dark:text-white/40">
                                    −{hint.penalty_points} {t("diagnostics.hints.pts")}
                                </span>
                            </div>

                            {hint.revealed && hint.content ? (
                                <p className="mt-1.5 text-xs leading-5 text-[#3A3A3A]/70 dark:text-white/70">{hint.content}</p>
                            ) : (
                                <button
                                    type="button"
                                    disabled={disabled || remaining <= 0}
                                    onClick={() => onUse(hint.id)}
                                    className="mt-2 w-full rounded-lg bg-white dark:bg-[#1b1b20] px-3 py-2 text-xs font-bold text-[#F47822] shadow-sm transition hover:bg-[#F47822] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {t("diagnostics.hints.reveal")}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
