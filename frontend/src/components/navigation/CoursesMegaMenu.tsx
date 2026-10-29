import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Globe2,
  Languages,
  ShieldCheck,
} from "lucide-react";
import type { TFunction } from "i18next";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { FocusEvent, MouseEvent as ReactMouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";

import { coursesApi } from "@/features/courses/api/courses.api";
import { resolveCourseImage } from "@/features/courses/components/CourseThumbnail";
import type { Course } from "@/features/courses/types/course.types";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";

interface FeaturedCourse {
  course_id: string;
  badge_label?: string | null;
}

interface CoursesMegaMenuProps {
  navLinkClass: (args: { isActive: boolean }) => string;
}

interface PanelGeometry {
  left: number;
  top: number;
  width: number;
}

const PANEL_MAX_WIDTH = 1080;
const VIEWPORT_GUTTER = 16;
const PANEL_GAP = 10;
const CLOSE_DELAY = 180;

function formatDuration(minutes: number, t: TFunction): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return t("navigation.coursesMenu.selfPaced");
  }

  if (minutes < 60) {
    return t("navigation.coursesMenu.minutes", { value: minutes });
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return t("navigation.coursesMenu.hours", { value: hours });
  }

  return t("navigation.coursesMenu.hoursMinutes", {
    hours,
    minutes: remaining,
  });
}

function VerificationMethodCard({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();

  const steps = [
    t("navigation.coursesMenu.verify.stepScan"),
    t("navigation.coursesMenu.verify.stepLookup"),
    t("navigation.coursesMenu.verify.stepConfirm"),
  ];

  return (
    <div className="relative flex h-full min-h-[420px] flex-col overflow-hidden bg-[#181818] p-6 text-white xl:p-7">
      {/* One restrained accent; the rest of the panel stays typographic. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute end-6 top-6 animate-verify-float text-[#F47822]/35"
      >
        <ShieldCheck className="h-8 w-8" strokeWidth={1.4} />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div>
          <p className="flex items-center gap-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <span aria-hidden="true" className="h-px w-5 bg-[#F47822]" />
            {t("navigation.coursesMenu.verify.eyebrow")}
          </p>

          <h3 className="mt-5 max-w-[250px] text-[26px] font-semibold leading-[1.12] tracking-[-0.035em]">
            {t("navigation.coursesMenu.verify.title")}
          </h3>

          <p className="mt-3 max-w-[270px] text-[11.5px] leading-6 text-white/50">
            {t("navigation.coursesMenu.verify.description")}
          </p>
        </div>

        <ol className="border-t border-white/10">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-3 border-b border-white/10 py-3.5"
            >
              <span className="font-mono text-[9px] font-medium tracking-[0.1em] text-[#F47822]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-medium text-white/65">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div>
          <Link
            to="/verify-certificate"
            onClick={onNavigate}
            className="group flex items-center justify-between gap-3 rounded-lg bg-[#F47822] px-4 py-3.5 text-[12px] font-semibold text-white transition-colors duration-200 hover:bg-[#df6817]"
          >
            {t("navigation.coursesMenu.verify.cta")}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
          </Link>

          <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">
            {t("navigation.coursesMenu.verify.code")}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CoursesMegaMenu({ navLinkClass }: CoursesMegaMenuProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [panel, setPanel] = useState<PanelGeometry>({
    left: 0,
    top: 0,
    width: PANEL_MAX_WIDTH,
  });

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const requestedRef = useRef(false);

  const difficultyLabels: Record<string, string> = {
    beginner: t("catalogPage.difficulty.beginner"),
    intermediate: t("catalogPage.difficulty.intermediate"),
    advanced: t("catalogPage.difficulty.advanced"),
  };

  const languageLabels: Record<string, string> = {
    en: t("navigation.coursesMenu.languages.en"),
    ar: t("navigation.coursesMenu.languages.ar"),
    fr: t("navigation.coursesMenu.languages.fr"),
  };

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const closeMenu = useCallback(() => {
    cancelClose();
    setOpen(false);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
    }, CLOSE_DELAY);
  }, [cancelClose]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  /*
   * Position the panel below the fixed header instead of below the short
   * nav link. The width is clamped to the viewport so it never overflows.
   */
  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const updateGeometry = () => {
      const trigger = rootRef.current;

      if (!trigger) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const headerRect = trigger
        .closest("header")
        ?.getBoundingClientRect();

      const width = Math.min(
        PANEL_MAX_WIDTH,
        window.innerWidth - VIEWPORT_GUTTER * 2,
      );

      const centeredLeft =
        triggerRect.left + triggerRect.width / 2 - width / 2;

      const viewportLeft = Math.max(
        VIEWPORT_GUTTER,
        Math.min(centeredLeft, window.innerWidth - width - VIEWPORT_GUTTER),
      );

      setPanel({
        left: viewportLeft - triggerRect.left,
        top:
          (headerRect?.bottom ?? triggerRect.bottom) +
          PANEL_GAP -
          triggerRect.top,
        width,
      });
    };

    updateGeometry();

    window.addEventListener("resize", updateGeometry);
    window.addEventListener("scroll", updateGeometry, { passive: true });

    return () => {
      window.removeEventListener("resize", updateGeometry);
      window.removeEventListener("scroll", updateGeometry);
    };
  }, [open]);

  /*
   * Fetch lazily on first open. The featured feed is the curated
   * merchandising order; it is the best-seller signal we have today.
   */
  useEffect(() => {
    if (!open || requestedRef.current) {
      return;
    }

    requestedRef.current = true;
    setStatus("loading");

    void Promise.all([
      coursesApi.list({ per_page: 24 }),
      api<FeaturedCourse[]>("/v1/featured").catch(() => []),
    ])
      .then(([catalog, featured]) => {
        const rank = new Map(
          (Array.isArray(featured) ? featured : []).map((entry, index) => [
            String(entry.course_id),
            index,
          ]),
        );

        const ordered = [...(catalog?.data ?? [])]
          .sort((a, b) => {
            const aRank = rank.get(String(a.id));
            const bRank = rank.get(String(b.id));

            return (
              (aRank ?? Number.MAX_SAFE_INTEGER) -
              (bRank ?? Number.MAX_SAFE_INTEGER)
            );
          })
          .slice(0, 3);

        setCourses(ordered);
        setStatus("ready");
      })
      .catch(() => {
        requestedRef.current = false;
        setCourses([]);
        setStatus("error");
      });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;

    if (!next || !event.currentTarget.contains(next)) {
      scheduleClose();
    }
  }

  function handlePanelClick(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (target.closest("a")) {
      closeMenu();
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocusCapture={openMenu}
      onBlurCapture={handleBlur}
    >
      <NavLink
        ref={triggerRef}
        to="/catalog"
        className={navLinkClass}
        onClick={closeMenu}
        aria-expanded={open}
        aria-controls="courses-mega-menu"
      >
        {({ isActive }) => (
          <>
            <span className="inline-flex items-center gap-1.5">
              {t("navigation.courses")}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </span>

            <span
              className={cn(
                "absolute bottom-0 left-3 right-3",
                "h-[2px] rounded-full bg-hbt-orange transition-all duration-200",
                isActive
                  ? "scale-x-100 opacity-100"
                  : "scale-x-0 opacity-0",
              )}
            />
          </>
        )}
      </NavLink>

      {open && (
        <div
          ref={panelRef}
          id="courses-mega-menu"
          role="region"
          aria-label={t("navigation.coursesMenu.label")}
          aria-busy={status === "loading"}
          data-testid="courses-mega-menu"
          onClick={handlePanelClick}
          style={{
            left: panel.left,
            top: panel.top,
            width: panel.width,
          }}
          className="absolute z-50 origin-top animate-mega-menu"
        >
          <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain">
            <div className="overflow-hidden rounded-[26px] border border-black/[0.06] bg-white dark:border-white/10 dark:bg-[#1b1b20]">
              <div className="grid grid-cols-[minmax(0,1fr)_360px] lg:h-[520px]">
                {/* =================================================
                    BEST SELLERS
                ================================================== */}

                <div className="flex h-full min-w-0 flex-col p-5 xl:p-6">
                  <div className="flex items-end justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/8">
                    <div>
                      <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-hbt-orange">
                        <span
                          aria-hidden="true"
                          className="h-px w-5 bg-hbt-orange"
                        />
                        {t("navigation.coursesMenu.bestSellers")}
                      </p>

                      <p className="mt-2 text-xs text-slate-500 dark:text-white/45">
                        {t("navigation.coursesMenu.bestSellersHint")}
                      </p>
                    </div>

                    <Link
                      to="/catalog"
                      className="group inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-hbt-dark/60 transition-colors hover:text-hbt-orange dark:text-white/55"
                    >
                      {t("navigation.coursesMenu.browseAll")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col">
                    {status === "loading" ? (
                      <div className="space-y-2.5">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 rounded-2xl border border-slate-100 p-3 dark:border-white/8"
                          >
                            <div className="h-[92px] w-[136px] shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
                            <div className="flex-1 space-y-3">
                              <div className="h-4 w-3/5 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                              <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-white/8" />
                              <div className="h-2.5 w-2/5 animate-pulse rounded bg-slate-100 dark:bg-white/8" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : status === "error" ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-white/10">
                        <p className="text-sm font-semibold text-hbt-dark dark:text-[#ececef]">
                          {t("navigation.coursesMenu.errorTitle")}
                        </p>
                        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500 dark:text-white/45">
                          {t("navigation.coursesMenu.errorBody")}
                        </p>
                        <Link
                          to="/catalog"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-hbt-orange px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#df6817]"
                        >
                          {t("navigation.coursesMenu.browseAll")}
                          <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                        </Link>
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-white/10">
                        <p className="text-sm font-semibold text-hbt-dark dark:text-[#ececef]">
                          {t("navigation.coursesMenu.emptyTitle")}
                        </p>
                        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500 dark:text-white/45">
                          {t("navigation.coursesMenu.emptyBody")}
                        </p>
                        <Link
                          to="/catalog"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-hbt-orange px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#df6817]"
                        >
                          {t("navigation.coursesMenu.browseAll")}
                          <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {courses.map((course, index) => {
                          const difficultyKey = (
                            course.difficulty ?? ""
                          ).toLowerCase();

                          const level =
                            difficultyLabels[difficultyKey] ||
                            course.difficulty ||
                            t("navigation.coursesMenu.allLevels");

                          const duration = formatDuration(
                            course.duration_minutes,
                            t,
                          );

                          const languageCode = (
                            course.language ?? ""
                          )
                            .toLowerCase()
                            .split("-")[0];

                          const language =
                            languageLabels[languageCode] ||
                            course.language?.toUpperCase() ||
                            t("navigation.coursesMenu.selfPaced");

                          return (
                            <Link
                              key={course.id}
                              to={`/courses/${course.id}`}
                              data-testid="courses-mega-card"
                              className="group/card flex h-[122px] min-w-0 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-hbt-orange/40 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-hbt-orange/40"
                            >
                              <div className="relative h-[92px] w-[136px] shrink-0 overflow-hidden rounded-xl bg-[#222]">
                                <img
                                  src={resolveCourseImage(
                                    course.title,
                                    course.thumbnail,
                                  )}
                                  alt=""
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = resolveCourseImage(
                                      course.title,
                                      null,
                                    );
                                  }}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
                                />

                                <span className="absolute start-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.08em] text-white backdrop-blur-sm">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-semibold leading-6 tracking-[-0.01em] text-hbt-dark transition-colors group-hover/card:text-hbt-orange dark:text-[#ececef]">
                                  {course.title}
                                </p>

                                {course.short_description ? (
                                  <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-slate-500 dark:text-white/45">
                                    {course.short_description}
                                  </p>
                                ) : null}

                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-500 dark:text-white/45">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="h-3.5 w-3.5 shrink-0" />
                                    {duration}
                                  </span>

                                  <span
                                    aria-hidden="true"
                                    className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"
                                  />

                                  <span className="truncate">{level}</span>

                                  <span
                                    aria-hidden="true"
                                    className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"
                                  />

                                  <span className="inline-flex items-center gap-1.5">
                                    <Globe2 className="h-3.5 w-3.5 shrink-0" />
                                    {t("navigation.coursesMenu.online")}
                                  </span>

                                  <span
                                    aria-hidden="true"
                                    className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"
                                  />

                                  <span className="inline-flex items-center gap-1.5">
                                    <Languages className="h-3.5 w-3.5 shrink-0" />
                                    {language}
                                  </span>
                                </div>
                              </div>

                              <ArrowRight className="me-1 h-4 w-4 shrink-0 text-slate-300 transition-colors duration-200 group-hover/card:text-hbt-orange dark:text-white/25 rtl:-scale-x-100" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* =================================================
                    VERIFICATION PANEL
                ================================================== */}

                <div className="border-s border-slate-100 dark:border-white/10">
                  <VerificationMethodCard onNavigate={closeMenu} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
