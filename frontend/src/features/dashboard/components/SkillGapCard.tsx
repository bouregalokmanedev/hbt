import { AlertTriangle, BookOpen, ClipboardCheck, GraduationCap, RotateCcw, Sparkles, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { mentorApi } from "@/features/ai-mentor/api/mentor-api";
import type { CohortOverview, ReviewDueItem, SkillGap } from "../types/dashboard.types";

interface SharpItem {
    key: string;
    title: string;
    course: string;
    detail: string;
    cta: string;
    action: string;
    kind: "missed" | "quiz" | "lesson";
}

/**
 * One card for "what to fix next": missed quizzes (from Review due) and
 * areas below the pass mark used to live in two cards that both linked to
 * the same retake page. They are merged, de-duplicated by target URL, and
 * missed quizzes win so the wrong-answer count stays visible.
 */
export function SkillGapCard({
    gaps,
    reviewDue,
}: {
    gaps: SkillGap[];
    reviewDue: ReviewDueItem[];
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [generating, setGenerating] = useState(false);

    const items: SharpItem[] = (() => {
        const seen = new Set<string>();
        const merged: SharpItem[] = [];

        for (const item of reviewDue) {
            if (seen.has(item.action_url)) continue;
            seen.add(item.action_url);
            merged.push({
                key: `missed-${item.id}`,
                title: item.title,
                course: item.course_title,
                detail: t("dashboard.skillGap.missed", { wrong: item.wrong_count }),
                cta: t("dashboard.skillGap.review"),
                action: item.action_url,
                kind: "missed",
            });
        }

        gaps.forEach((gap, index) => {
            if (seen.has(gap.action_url)) return;
            seen.add(gap.action_url);
            merged.push({
                key: `gap-${gap.type}-${gap.title}-${index}`,
                title: gap.title,
                course: gap.course_title,
                detail: `${gap.score ?? 0}% / ${gap.required ?? 0}%`,
                cta: t("dashboard.skillGap.retake"),
                action: gap.action_url,
                kind: gap.type === "quiz" ? "quiz" : "lesson",
            });
        });

        return merged;
    })();

    const weakest = gaps[0];
    const onPractice = async () => {
        if (!weakest || generating) return;
        setGenerating(true);
        try {
            const res = await mentorApi.practiceQuiz({ topic: weakest.title });
            // Store generated quiz for quick preview; navigate to AI mentor for full chat
            sessionStorage.setItem("hbt:practice-quiz", JSON.stringify(res));
            navigate("/ai-mentor", { state: { practiceQuiz: res } });
        } catch {
            navigate("/ai-mentor");
        } finally {
            setGenerating(false);
        }
    };

    if (items.length === 0) {
        return (
            <section
                data-testid="skill-gap-clear"
                className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t("dashboard.skillGap.clearTitle")}</h3>
                        <p className="mt-0.5 text-xs text-emerald-700/70 dark:text-emerald-300/70">{t("dashboard.skillGap.clearDesc")}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section data-testid="sharpen-card" className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">{t("dashboard.skillGap.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("dashboard.skillGap.subtitle", { n: items.length })}</p>
                </div>
                {gaps.length > 0 && (
                    <button
                        type="button"
                        onClick={() => void onPractice()}
                        disabled={generating}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#E96D18] disabled:opacity-60"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        {generating ? t("dashboard.skillGap.generating") : t("dashboard.skillGap.practice")}
                    </button>
                )}
            </div>
            <div className="mt-4 space-y-2">
                {items.map((item) => (
                    <Link
                        key={item.key}
                        to={item.action}
                        data-testid={`sharpen-item-${item.kind}`}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-3 transition hover:bg-muted/40"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                            {item.kind === "missed" ? (
                                <RotateCcw className="h-4 w-4 text-[#F47822]" />
                            ) : item.kind === "quiz" ? (
                                <ClipboardCheck className="h-4 w-4 text-[#F47822]" />
                            ) : (
                                <BookOpen className="h-4 w-4 text-[#1F6AE1]" />
                            )}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
                            <span className="text-xs text-muted-foreground">
                                {item.course} · {item.detail}
                            </span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-[#F47822]">{item.cta}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export function CohortOverviewCard({ cohort }: { cohort: CohortOverview }) {
    const { t } = useTranslation();
    return (
        <section className="rounded-3xl border border-[#1F6AE1]/20 bg-[#1F6AE1]/[0.04] p-6 dark:border-[#1F6AE1]/30">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F6AE1]/10 text-[#1F6AE1]">
                    <Users className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-foreground">{t("dashboard.cohort.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("dashboard.cohort.subtitle", { n: cohort.courses })}</p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-background p-3">
                    <p className="text-xs text-muted-foreground">{t("dashboard.cohort.enrollments")}</p>
                    <p className="mt-1 text-lg font-bold">{cohort.total_enrollments}</p>
                </div>
                <div className="rounded-2xl bg-background p-3">
                    <p className="text-xs text-muted-foreground">{t("dashboard.cohort.avgProgress")}</p>
                    <p className="mt-1 text-lg font-bold">{cohort.avg_progress}%</p>
                </div>
                <div className="rounded-2xl bg-background p-3">
                    <p className="text-xs text-muted-foreground">{t("dashboard.cohort.completed")}</p>
                    <p className="mt-1 text-lg font-bold">{cohort.by_status["completed"] ?? 0}</p>
                </div>
            </div>
        </section>
    );
}
