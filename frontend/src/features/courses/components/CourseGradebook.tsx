import {
  Award,
  CheckCircle2,
  ClipboardList,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

import type { CourseGradebook as CourseGradebookData } from "../types/course.types";

export function CourseGradebook({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const { t } = useTranslation();
  const [gradebook, setGradebook] = useState<CourseGradebookData | null>(null);

  useEffect(() => {
    if (!enrolled) return;

    let active = true;

    void fetch(`${env.apiUrl}/v1/courses/${courseId}/gradebook`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authStorage.getToken() ?? ""}`,
      },
    })
      .then(async (response) => (response.ok ? ((await response.json()) as { data: CourseGradebookData }) : null))
      .then((payload) => {
        if (active) setGradebook(payload?.data ?? null);
      })
      .catch(() => {
        if (active) setGradebook(null);
      });

    return () => {
      active = false;
    };
  }, [courseId, enrolled]);

  if (!enrolled || !gradebook || gradebook.components.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("courseDetails.gradebook.eyebrow")}</p>
          <h2 className="mt-2 text-xl font-bold text-foreground">{t("courseDetails.gradebook.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("courseDetails.gradebook.desc")}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[#F47822]/8 px-4 py-3">
          <Award className="h-5 w-5 text-[#F47822]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#F47822]">{t("courseDetails.gradebook.overall")}</p>
            <p className="text-lg font-bold text-foreground">{gradebook.overall_score}% · {gradebook.letter_grade}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {gradebook.components.map((component) => (
          <div key={component.key} className="rounded-2xl border border-[#3A3A3A]/8 bg-[#F7F7F7] p-4 dark:border-white/8 dark:bg-[#101013]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/45 dark:text-white/45">{component.label}</span>
              <span className="text-xs font-bold text-[#F47822]">{component.weight_percent}%</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{component.score}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
              <div className="h-full rounded-full bg-[#F47822]" style={{ width: `${Math.min(component.score, 100)}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-[#3A3A3A]/50 dark:text-white/50">
              {component.key === "lessons"
                ? t("courseDetails.gradebook.lessonsDone", { done: component.completed, total: component.total })
                : t("courseDetails.gradebook.itemsPassed", { done: component.completed, total: component.total })}
            </p>
          </div>
        ))}
      </div>

      {gradebook.components.some((component) => component.items.length > 0) && (
        <div className="mt-6 space-y-5">
          {gradebook.components.map((component) => component.items.length > 0 && (
            <div key={component.key}>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#F47822]" />
                <h3 className="text-sm font-semibold text-foreground">{component.label}</h3>
              </div>
              <div className="mt-3 space-y-2">
                {component.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#3A3A3A]/8 bg-white px-4 py-3 dark:border-white/8 dark:bg-[#1b1b20]">
                    <div className="min-w-[160px] flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                        {item.required ? t("courseDetails.gradebook.required") : t("courseDetails.gradebook.optional")}
                        {" · "}
                        {t("courseDetails.gradebook.minScore", { score: item.minimum_score })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${item.passed ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>
                      {item.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                      {item.attempted ? `${item.score}%` : t("courseDetails.gradebook.notAttempted")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
