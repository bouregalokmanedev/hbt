import { Award, CheckCircle2, GraduationCap, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { getInstructorGradebook } from "../api/instructorApi";

export function InstructorGradebook({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const gradebook = useQuery({
    queryKey: ["instructor", "gradebook", courseId],
    queryFn: () => getInstructorGradebook(courseId),
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });

  if (gradebook.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-black/5" />;
  }

  if (gradebook.isError || !gradebook.data) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
        {t("instructor.analytics.gradebook.error")}
      </section>
    );
  }

  const data = gradebook.data;

  return (
    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.analytics.gradebook.title")}</h2>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45 dark:text-white/45">{t("instructor.analytics.gradebook.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3A3A3A]/5 px-3 py-1.5 text-xs font-semibold text-[#3A3A3A]/65 dark:bg-white/5 dark:text-white/65">
            <Users className="h-3.5 w-3.5" /> {t("instructor.analytics.gradebook.students", { count: data.summary.students })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822]/10 px-3 py-1.5 text-xs font-semibold text-[#F47822]">
            <Award className="h-3.5 w-3.5" /> {t("instructor.analytics.gradebook.average", { score: data.summary.average_score })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t("instructor.analytics.gradebook.passing", { count: data.summary.passing })}
          </span>
        </div>
      </div>

      {data.students.length === 0 ? (
        <p className="mt-5 rounded-xl bg-[#FCFCFC] px-4 py-6 text-center text-xs leading-5 text-[#3A3A3A]/45 dark:bg-[#101013] dark:text-white/45">
          {t("instructor.analytics.gradebook.empty")}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left rtl:text-right">
            <thead className="border-b border-[#3A3A3A]/7 text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/35 dark:border-white/7 dark:text-white/35">
              <tr>
                <th className="pb-3">{t("instructor.analytics.gradebook.colStudent")}</th>
                <th className="pb-3">{t("instructor.analytics.gradebook.colLessons")}</th>
                <th className="pb-3">{t("instructor.analytics.gradebook.colAssessments")}</th>
                <th className="pb-3">{t("instructor.analytics.gradebook.colPracticals")}</th>
                <th className="pb-3">{t("instructor.analytics.gradebook.colOverall")}</th>
                <th className="pb-3">{t("instructor.analytics.gradebook.colStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A3A3A]/7 dark:divide-white/7">
              {data.students.map((row) => {
                const byKey = Object.fromEntries(row.grade.components.map((component) => [component.key, component.score]));

                return (
                  <tr key={row.enrollment_id}>
                    <td className="py-4">
                      <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{row.student.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{row.student.email}</p>
                    </td>
                    <td className="py-4 text-sm text-[#3A3A3A]/65 dark:text-white/65">{byKey.lessons ?? 0}%</td>
                    <td className="py-4 text-sm text-[#3A3A3A]/65 dark:text-white/65">{byKey.assessments ?? 0}%</td>
                    <td className="py-4 text-sm text-[#3A3A3A]/65 dark:text-white/65">{byKey.practicals ?? 0}%</td>
                    <td className="py-4 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{row.grade.overall_score}% · {row.grade.letter_grade}</td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.grade.passed ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>
                        {row.grade.passed ? t("instructor.analytics.gradebook.passed") : t("instructor.analytics.gradebook.inProgress")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
