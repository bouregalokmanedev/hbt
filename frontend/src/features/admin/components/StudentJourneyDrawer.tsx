import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FlaskConical,
  ShieldAlert,
  X,
} from "lucide-react";

import { adminApi } from "../api/adminApi";
import type { AdminSimulatorSessionRow, AdminStudent, AdminStudentJourney, JourneyEnrollment } from "../types/admin";
import { useTranslation } from "react-i18next";
import { ErrorAdminPage, LoadingAdminPage } from "./AdminUi";

export function StudentJourneyDrawer({
  student,
  onClose,
}: {
  student: AdminStudent;
  onClose: () => void;
}) {
  const journey = useQuery({
    queryKey: ["admin", "student-journey", student.id],
    queryFn: () => adminApi.studentJourney(student.id),
  });
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={t("admin.drawers.journey.journeyOf", { name: student.name })}>
      <button type="button" aria-label={t("admin.drawers.journey.closeJourney")} onClick={onClose} className="absolute inset-0 bg-[#3A3A3A]/45 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-2xl flex-col overflow-hidden bg-[#F7F7F7] shadow-2xl">
        <div className="h-1.5 w-full bg-[#F47822]" />
        <div className="flex items-start justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-sm font-bold text-[#F47822]">
              {student.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">{t("admin.drawers.journey.eyebrow")}</p>
              <p className="mt-0.5 text-base font-bold text-[#3A3A3A]">{student.name}</p>
              <p className="text-xs text-[#3A3A3A]/50">{student.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("admin.drawers.journey.close")}
            className="rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-[#F3F3F3] hover:text-[#3A3A3A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {journey.isLoading && <LoadingAdminPage />}
          {journey.isError && <ErrorAdminPage onRetry={() => void journey.refetch()} />}
          {journey.data && <JourneyBody data={journey.data} />}
        </div>
      </aside>
    </div>
  );
}

function JourneyBody({ data }: { data: AdminStudentJourney }) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <section className={`grid grid-cols-2 gap-2.5 ${data.summary.simulator_sessions != null ? "sm:grid-cols-6" : "sm:grid-cols-5"}`}>
        <SummaryStat label={t("admin.drawers.journey.summary.enrollments")} value={data.summary.enrollments} />
        <SummaryStat label={t("admin.drawers.journey.summary.completed")} value={data.summary.completed} />
        <SummaryStat label={t("admin.drawers.journey.summary.certificates")} value={data.summary.certificates} />
        <SummaryStat label={t("admin.drawers.journey.summary.quizTries")} value={data.summary.quiz_attempts} />
        <SummaryStat label={t("admin.drawers.journey.summary.assessTries")} value={data.summary.assessment_attempts} />
        {data.summary.simulator_sessions != null && (
          <SummaryStat label={t("admin.drawers.journey.summary.simulatorSessions")} value={data.summary.simulator_sessions} />
        )}
      </section>

      <section>
        <SectionTitle>{t("admin.drawers.journey.courses", { count: data.journey.length })}</SectionTitle>
        {data.journey.length === 0 && <Empty text={t("admin.drawers.journey.empty.enrollments")} />}
        <div className="mt-2.5 space-y-3">
          {data.journey.map((entry) => (
            <EnrollmentCard key={entry.enrollment_id} entry={entry} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>{t("admin.drawers.journey.quizAttempts", { count: data.quiz_attempts.length })}</SectionTitle>
        {data.quiz_attempts.length === 0 ? (
          <Empty text={t("admin.drawers.journey.empty.quiz")} />
        ) : (
          <ul className="mt-2.5 space-y-2">
            {data.quiz_attempts.map((attempt) => (
              <li key={attempt.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    attempt.passed ? "bg-emerald-50 text-emerald-600" : "bg-[#F47822]/10 text-[#F47822]"
                  }`}
                >
                  <ClipboardCheck className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-[#3A3A3A]">
                    {attempt.quiz ?? t("admin.drawers.journey.quizFallback")}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#3A3A3A]/50">
                    {attempt.score ?? "—"}/{attempt.total_points ?? "—"}
                    {attempt.percentage != null ? ` · ${attempt.percentage}%` : ""} ·{" "}
                    {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString(i18n.language) : t("admin.drawers.journey.inProgress")}
                  </span>
                </span>
                <Badge ok={attempt.passed} yes={t("admin.drawers.journey.passed")} no={t("admin.drawers.journey.failed")} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>{t("admin.drawers.journey.assessAttempts", { count: data.assessment_attempts.length })}</SectionTitle>
        {data.assessment_attempts.length === 0 ? (
          <Empty text={t("admin.drawers.journey.empty.assessment")} />
        ) : (
          <ul className="mt-2.5 space-y-2">
            {data.assessment_attempts.map((attempt) => (
              <li key={attempt.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    attempt.passed ? "bg-emerald-50 text-emerald-600" : "bg-[#F47822]/10 text-[#F47822]"
                  }`}
                >
                  <Award className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-[#3A3A3A]">
                    {attempt.assessment ?? t("admin.drawers.journey.assessFallback")}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#3A3A3A]/50">
                    {t("admin.drawers.journey.score", { value: attempt.result_score ?? attempt.score ?? "—" })} ·{" "}
                    {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString(i18n.language) : t("admin.drawers.journey.inProgress")}
                  </span>
                </span>
                <Badge ok={attempt.result_passed ?? attempt.passed} yes={t("admin.drawers.journey.passed")} no={t("admin.drawers.journey.failed")} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>{t("admin.drawers.journey.certificates", { count: data.certificates.length })}</SectionTitle>
        {data.certificates.length === 0 ? (
          <Empty text={t("admin.drawers.journey.empty.certificates")} />
        ) : (
          <ul className="mt-2.5 space-y-2">
            {data.certificates.map((certificate) => (
              <li key={certificate.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                  <Award className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-[#3A3A3A]">{certificate.course_title}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-[#3A3A3A]/50">
                    {certificate.certificate_number} ·{" "}
                    {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString(i18n.language) : "—"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="journey-simulator">
        <SectionTitle>
          {t("admin.drawers.journey.simulator.title", { count: data.simulator?.sessions.length ?? 0 })}
        </SectionTitle>
        {!data.simulator || data.simulator.sessions.length === 0 ? (
          <Empty text={t("admin.drawers.journey.empty.simulator")} />
        ) : (
          <>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryStat label={t("admin.drawers.journey.summary.sessions")} value={data.simulator.summary.sessions} />
              <SummaryStat label={t("admin.drawers.journey.summary.avgScore")} value={`${data.simulator.summary.average_score}%`} />
              <SummaryStat label={t("admin.drawers.journey.summary.passRate")} value={`${data.simulator.summary.pass_rate}%`} />
              <SummaryStat label={t("admin.drawers.journey.summary.avgDuration")} value={formatSimDuration(data.simulator.summary.average_duration_seconds)} />
            </div>
            <ul className="mt-2.5 space-y-2">
              {data.simulator.sessions.map((session) => (
                <SimulatorRow key={session.id} session={session} />
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <SectionTitle>{t("admin.drawers.journey.activity")}</SectionTitle>
        {data.activity.length === 0 ? (
          <Empty text={t("admin.drawers.journey.empty.activity")} />
        ) : (
          <ul className="mt-2.5 space-y-2">
            {data.activity.map((event, index) => (
              <li key={`${event.created_at}-${index}`} className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5">
                <ShieldAlert className={`h-4 w-4 shrink-0 ${event.successful ? "text-emerald-500" : "text-red-400"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[11px] font-semibold text-[#3A3A3A]">
                    {event.event ?? t("admin.drawers.journey.unknownEvent")}
                  </span>
                  <span className="block font-mono text-[10px] text-[#3A3A3A]/45">
                    {event.ip_address ?? "—"} · {event.created_at ? new Date(event.created_at).toLocaleString(i18n.language) : "—"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function SimulatorRow({ session }: { session: AdminSimulatorSessionRow }) {
  const { t, i18n } = useTranslation();
  const passed = session.result?.outcome === "pass";
  const failed = session.result?.outcome === "fail";
  return (
    <li className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
          passed ? "bg-emerald-50 text-emerald-600" : "bg-[#F47822]/10 text-[#F47822]"
        }`}
      >
        <FlaskConical className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-[#3A3A3A]">
          {t(`admin.drawers.journey.simulator.tools.${session.tool}`)}
          {session.vehicle_key ? ` · ${session.vehicle_key}` : ""}
        </span>
        <span className="mt-0.5 block text-[11px] text-[#3A3A3A]/50">
          {t("admin.drawers.journey.score", { value: session.result?.score ?? session.score ?? "—" })}
          {" · "}
          {formatSimDuration(session.result?.duration_seconds ?? session.duration_seconds)}
          {" · "}
          {session.started_at ? new Date(session.started_at).toLocaleDateString(i18n.language) : "—"}
        </span>
      </span>
      <Badge
        ok={passed}
        yes={t("admin.drawers.journey.simulator.pass")}
        no={failed ? t("admin.drawers.journey.simulator.fail") : t("admin.drawers.journey.simulator.inProgress")}
      />
    </li>
  );
}

function formatSimDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return "—";
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function EnrollmentCard({ entry }: { entry: JourneyEnrollment }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const completedLessons = entry.sections.flatMap((section) => section.lessons).filter((lesson) => lesson.is_completed).length;
  const totalLessons = entry.sections.flatMap((section) => section.lessons).length;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left rtl:text-right">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
          <BookOpen className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-[#3A3A3A]">{entry.course.title}</span>
          <span className="mt-0.5 block text-[11px] capitalize text-[#3A3A3A]/50">
            {entry.enrollment_status} · {t("admin.drawers.journey.lessonsCount", { done: completedLessons, total: totalLessons })}
          </span>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8">
            <span className="block h-full rounded-full bg-[#F47822]" style={{ width: `${entry.progress.progress_percentage}%` }} />
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold text-[#3A3A3A]">{entry.progress.progress_percentage}%</span>
          <ChevronDown className={`h-4 w-4 text-[#3A3A3A]/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-[#3A3A3A]/8 bg-[#FCFCFC] px-4 py-4">
          {entry.sections.length === 0 && <p className="text-xs text-[#3A3A3A]/50">{t("admin.drawers.journey.noCurriculum")}</p>}
          {entry.sections.map((section) => (
            <div key={section.id} className="rounded-xl border border-[#3A3A3A]/8 bg-white px-3.5 py-3">
              <p className="flex items-center justify-between gap-2 text-xs font-bold text-[#3A3A3A]">
                <span className="truncate">
                  {section.position}. {section.title}
                </span>
                {section.is_completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${section.progress_percentage}%` }} />
              </div>
              <ul className="mt-2 space-y-1.5">
                {section.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center gap-2 text-[11px]">
                    {lesson.is_completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/30" />
                    )}
                    <span className={`min-w-0 flex-1 truncate ${lesson.is_completed ? "text-[#3A3A3A]/60" : "text-[#3A3A3A]"}`}>
                      {lesson.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[#3A3A3A]/40">{lesson.progress_percentage}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white px-3.5 py-3 text-center shadow-[0_4px_14px_rgba(58,58,58,.05)]">
      <p className="text-xl font-bold text-[#3A3A3A]">{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/45">{label}</p>
    </div>
  );
}

function Badge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {ok ? yes : no}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mt-2 rounded-xl bg-white px-4 py-3 text-xs text-[#3A3A3A]/50">{text}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3A3A3A]/45">{children}</h3>;
}
