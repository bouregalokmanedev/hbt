import {
  ArrowRight,
  Award,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  PlayCircle,
  Target,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type {
  CourseJourney,
  JourneyNextStepType,
  JourneyRequirement,
} from "../types/journey.types";

interface CourseJourneyCardProps {
  journey: CourseJourney;
  courseId: string;
  className?: string;
}

const stepIcon = (type: JourneyNextStepType) => {
  switch (type) {
    case "lesson":
      return PlayCircle;
    case "quiz":
      return ClipboardCheck;
    case "assessment":
      return Target;
    case "certificate":
      return Award;
    default:
      return Trophy;
  }
};

const requirementLabel = (
  requirement: JourneyRequirement,
  t: (key: string, options?: Record<string, unknown>) => string,
): string =>
  t(`courseDetails.journey.requirements.${requirement.key}`, {
    defaultValue: requirement.label,
  });

export function CourseJourneyCard({
  journey,
  courseId,
  className = "",
}: CourseJourneyCardProps) {
  const { t } = useTranslation();

  const step = journey.next_step;
  const type: JourneyNextStepType = step?.type
    ?? (journey.passed ? "completed" : "lesson");
  const Icon = stepIcon(type);

  const fallbackTitle =
    type === "certificate" || type === "completed" ? type : "inProgress";

  const title =
    step && !["certificate", "completed"].includes(step.type)
      ? step.title
      : t(`courseDetails.journey.titles.${fallbackTitle}`);

  const path = step?.path ?? `/courses/${courseId}`;
  const activeRequirements = (journey.requirements ?? []).filter(
    (item) => item.required > 0,
  );

  return (
    <section
      className={`group relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] ${className}`}
      data-testid="course-journey-card"
    >
      <div className={`h-1.5 ${journey.passed ? "bg-emerald-500" : "bg-[#F47822]"}`} />

      <div className="relative p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#F47822]/5 blur-3xl transition-all duration-500 group-hover:bg-[#F47822]/10" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                journey.passed
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-[#F47822]/10 text-[#F47822]"
              }`}
            >
              <Icon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p
                className={`text-xs font-bold uppercase tracking-[0.16em] ${
                  journey.passed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[#F47822]"
                }`}
              >
                {t(`courseDetails.journey.eyebrow.${type}`)}
              </p>

              <h2 className="mt-1.5 line-clamp-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t(`courseDetails.journey.desc.${type}`, {
                  done: journey.lessons.completed,
                  total: journey.lessons.required,
                })}
              </p>
            </div>
          </div>

          <Link
            to={path}
            className="group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e96b17] hover:shadow-[0_12px_28px_rgba(244,120,34,0.28)] lg:px-6"
          >
            {t(`courseDetails.journey.cta.${type}`)}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/button:translate-x-0.5 rtl:rotate-180 rtl:group-hover/button:-translate-x-0.5" />
          </Link>
        </div>

        {activeRequirements.length > 0 ? (
          <div className="relative mt-6 border-t border-border pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t("courseDetails.journey.checklistTitle")}
            </p>

            <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {activeRequirements.map((requirement) => (
                <li
                  key={requirement.key}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 ${
                    requirement.passed
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : "border-border bg-muted/25"
                  }`}
                >
                  {requirement.passed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}

                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                    {requirementLabel(requirement, t)}
                  </span>

                  <span
                    className={`text-[11px] font-bold ${
                      requirement.passed
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {requirement.completed}/{requirement.required}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {journey.certificate ? (
          <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  {t("courseDetails.journey.certificateIssued")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {journey.certificate.certificate_number}
                </p>
              </div>
            </div>

            <Link
              to="/certificates"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
            >
              {t("courseDetails.journey.openCertificate")}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
