import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, Star, UserCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import type { AdminInstructor } from "../types/admin";
import { ErrorAdminPage, LoadingAdminPage, Status } from "./AdminUi";

export function InstructorDetailDrawer({
  instructor,
  onClose,
}: {
  instructor: AdminInstructor;
  onClose: () => void;
}) {
  const detail = useQuery({
    queryKey: ["admin", "instructor", instructor.id],
    queryFn: () => adminApi.instructorDetail(instructor.id),
  });
  const { t } = useTranslation();

  const performance = detail.data?.performance;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={t("admin.drawers.instructor.profileOf", { name: instructor.name })}>
      <button type="button" aria-label={t("admin.drawers.instructor.closeProfile")} onClick={onClose} className="absolute inset-0 bg-[#3A3A3A]/45 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl">
        <div className="h-1.5 w-full bg-[#F47822]" />
        <div className="flex items-start justify-between gap-3 border-b border-[#3A3A3A]/8 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-sm font-bold text-[#F47822]">
              {instructor.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-base font-bold text-[#3A3A3A]">
                {instructor.name}
                {instructor.verified && <UserCheck className="h-4 w-4 text-emerald-600" />}
              </p>
              <p className="text-xs text-[#3A3A3A]/50">{instructor.email}</p>
              <div className="mt-1.5">
                <Status value={instructor.status} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("admin.drawers.instructor.close")}
            className="rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-[#F3F3F3] hover:text-[#3A3A3A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {detail.isLoading && <LoadingAdminPage />}
          {detail.isError && <ErrorAdminPage onRetry={() => void detail.refetch()} />}
          {detail.data && (
            <>
              <section>
                <SectionTitle>{t("admin.drawers.instructor.performance")}</SectionTitle>
                <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <Stat icon={<BookOpen className="h-4 w-4" />} label={t("admin.drawers.instructor.statCourses")} value={performance?.courses_count ?? 0} />
                  <Stat icon={<Award className="h-4 w-4" />} label={t("admin.drawers.instructor.statStudents")} value={performance?.students_taught ?? 0} />
                  <Stat
                    icon={<Star className="h-4 w-4" />}
                    label={t("admin.drawers.instructor.statRating")}
                    value={performance?.average_rating != null ? performance.average_rating.toFixed(1) : "—"}
                    hint={performance ? t("admin.drawers.instructor.reviews", { count: performance.reviews_count }) : undefined}
                  />
                </div>
                <p className="mt-2.5 text-[11px] leading-5 text-[#3A3A3A]/50">
                  {t("admin.drawers.instructor.enrollmentsNote", { count: performance?.total_enrollments ?? 0 })}{" "}
                  {t("admin.drawers.instructor.managePrefix")}{" "}
                  <Link to="/admin/users" className="font-bold text-[#F47822] hover:underline">
                    {t("admin.drawers.instructor.peoplePage")}
                  </Link>
                  .
                </p>
              </section>

              <section>
                <SectionTitle>{t("admin.drawers.instructor.courses", { count: detail.data.courses.length })}</SectionTitle>
                {detail.data.courses.length === 0 ? (
                  <p className="mt-2 text-xs text-[#3A3A3A]/50">{t("admin.drawers.instructor.noCourses")}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {detail.data.courses.map((course) => (
                      <li key={course.id} className="rounded-xl bg-[#FCFCFC] px-3.5 py-2.5">
                        <p className="truncate text-xs font-bold text-[#3A3A3A]">{course.title}</p>
                        <p className="mt-1 flex items-center gap-2 text-[11px] text-[#3A3A3A]/50">
                          <span className="font-bold capitalize">{course.status}</span>
                          <span>·</span>
                          <span>{t("admin.drawers.instructor.enrollmentsCount", { count: course.enrollments_count })}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <SectionTitle>{t("admin.drawers.instructor.feedbackTitle")}</SectionTitle>
                {detail.data.recent_feedback.length === 0 ? (
                  <p className="mt-2 text-xs text-[#3A3A3A]/50">{t("admin.drawers.instructor.noReviews")}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {detail.data.recent_feedback.map((item, index) => (
                      <li key={`${item.created_at}-${index}`} className="rounded-xl bg-[#FCFCFC] px-3.5 py-2.5">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {item.rating}/5 · {item.reviewer ?? t("admin.drawers.instructor.anonymous")}
                        </p>
                        {item.comment && (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#3A3A3A]/60">{item.comment}</p>
                        )}
                        <p className="mt-1 text-[10px] text-[#3A3A3A]/40">{item.course ?? ""}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3A3A3A]/45">{children}</h3>;
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-[#FCFCFC] px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#F47822]">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-xl font-bold text-[#3A3A3A]">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-[#3A3A3A]/45">{hint}</p>}
    </div>
  );
}
