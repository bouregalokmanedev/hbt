import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  GraduationCap,
  MapPin,
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

import type { Bootcamp } from "@/features/bootcamps/types/bootcamp.types";
import { bootcampsApi } from "@/features/bootcamps/api/bootcamps.api";
import {
  formatBootcampDate,
  formatBootcampDuration,
  formatBootcampLevel,
  formatBootcampPrice,
} from "@/features/bootcamps/utils/bootcampFormat";
import { cn } from "@/lib/cn";

interface BootcampsMegaMenuProps {
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

function nextSessionLabel(
  bootcamp: Bootcamp,
  language: string,
  t: TFunction,
): string {
  const schedule = bootcamp.schedules?.[0];

  if (!schedule) {
    return t("navigation.bootcampsMenu.noSession");
  }

  const start = formatBootcampDate(schedule.starts_at, language, {
    day: "numeric",
    month: "short",
  });
  const end = formatBootcampDate(schedule.ends_at, language, {
    day: "numeric",
    month: "short",
  });

  return `${start} – ${end}`;
}

export function BootcampsMegaMenu({
  navLinkClass,
}: BootcampsMegaMenuProps) {
  const { t, i18n } = useTranslation();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [panel, setPanel] = useState<PanelGeometry>({
    left: 0,
    top: 0,
    width: PANEL_MAX_WIDTH,
  });

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const requestedRef = useRef(false);

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
      const headerRect = trigger.closest("header")?.getBoundingClientRect();

      const width = Math.min(
        PANEL_MAX_WIDTH,
        window.innerWidth - VIEWPORT_GUTTER * 2,
      );

      const centeredLeft =
        triggerRect.left + triggerRect.width / 2 - width / 2;
      const viewportLeft = Math.max(
        VIEWPORT_GUTTER,
        Math.min(
          centeredLeft,
          window.innerWidth - width - VIEWPORT_GUTTER,
        ),
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

  useEffect(() => {
    if (!open || requestedRef.current) {
      return;
    }

    requestedRef.current = true;
    setStatus("loading");

    void bootcampsApi
      .list({ per_page: 3 })
      .then((response) => {
        setBootcamps((response.data ?? []).slice(0, 3));
        setStatus("ready");
      })
      .catch(() => {
        requestedRef.current = false;
        setBootcamps([]);
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
        to="/bootcamps"
        className={navLinkClass}
        onClick={closeMenu}
        aria-expanded={open}
        aria-controls="bootcamps-mega-menu"
      >
        {({ isActive }) => (
          <>
            <span className="inline-flex items-center gap-1.5">
              {t("navigation.bootcamps")}
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
          id="bootcamps-mega-menu"
          role="region"
          aria-label={t("navigation.bootcampsMenu.label")}
          aria-busy={status === "loading"}
          data-testid="bootcamps-mega-menu"
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
                <div className="flex h-full min-w-0 flex-col p-5 xl:p-6">
                  <div className="flex items-end justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/8">
                    <div>
                      <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-hbt-orange">
                        <span
                          aria-hidden="true"
                          className="h-px w-5 bg-hbt-orange"
                        />
                        {t("navigation.bootcampsMenu.eyebrow")}
                      </p>

                      <p className="mt-2 max-w-md text-xs text-slate-500 dark:text-white/45">
                        {t("navigation.bootcampsMenu.hint")}
                      </p>
                    </div>

                    <Link
                      to="/bootcamps"
                      className="group inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-hbt-dark/60 transition-colors hover:text-hbt-orange dark:text-white/55"
                    >
                      {t("navigation.bootcampsMenu.browseAll")}
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
                            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
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
                          {t("navigation.bootcampsMenu.errorTitle")}
                        </p>
                        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500 dark:text-white/45">
                          {t("navigation.bootcampsMenu.errorBody")}
                        </p>
                        <Link
                          to="/bootcamps"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-hbt-orange px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#df6817]"
                        >
                          {t("navigation.bootcampsMenu.browseAll")}
                          <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                        </Link>
                      </div>
                    ) : bootcamps.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-white/10">
                        <GraduationCap className="h-8 w-8 text-hbt-orange/60" />
                        <p className="mt-3 text-sm font-semibold text-hbt-dark dark:text-[#ececef]">
                          {t("navigation.bootcampsMenu.emptyTitle")}
                        </p>
                        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500 dark:text-white/45">
                          {t("navigation.bootcampsMenu.emptyBody")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {bootcamps.map((bootcamp, index) => (
                          <Link
                            key={bootcamp.id}
                            to={`/bootcamps/${bootcamp.id}`}
                            data-testid="bootcamp-mega-card"
                            className="group/card flex h-[122px] min-w-0 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-hbt-orange/40 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-hbt-orange/40"
                          >
                            <span className="relative h-[92px] w-[136px] shrink-0 overflow-hidden rounded-xl bg-[#222]">
                              {bootcamp.thumbnail ? (
                                <img
                                  src={bootcamp.thumbnail}
                                  alt=""
                                  loading="lazy"
                                  data-testid="bootcamp-mega-thumbnail"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
                                />
                              ) : (
                                <>
                                  <span
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,120,34,0.5),transparent_55%)]"
                                  />
                                  <span className="relative font-mono text-[9px] tracking-[0.14em] text-white/50">
                                    BC
                                  </span>
                                  <span className="relative text-lg font-black text-[#F9A16C]">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                </>
                              )}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[15px] font-semibold leading-6 tracking-[-0.01em] text-hbt-dark transition-colors group-hover/card:text-hbt-orange dark:text-[#ececef]">
                                {bootcamp.title}
                              </span>

                              {bootcamp.short_description ? (
                                <span className="mt-1 block truncate text-[11px] leading-5 text-slate-500 dark:text-white/45">
                                  {bootcamp.short_description}
                                </span>
                              ) : null}

                              <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-500 dark:text-white/45">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-3.5 w-3.5 shrink-0" />
                                  {formatBootcampDuration(
                                    bootcamp.duration_value,
                                    bootcamp.duration_unit,
                                    t,
                                  )}
                                </span>

                                <span
                                  aria-hidden="true"
                                  className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"
                                />

                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="max-w-32 truncate">
                                    {bootcamp.location}
                                  </span>
                                </span>

                                <span
                                  aria-hidden="true"
                                  className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"
                                />

                                <span className="truncate">
                                  {formatBootcampLevel(bootcamp.level, t)}
                                </span>

                                <span
                                  aria-hidden="true"
                                  className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"
                                />

                                <span className="inline-flex items-center gap-1.5 font-semibold text-hbt-dark/70 dark:text-white/70">
                                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-hbt-orange" />
                                  {nextSessionLabel(bootcamp, i18n.language, t)}
                                </span>
                              </span>
                            </span>

                            <ArrowRight className="me-1 h-4 w-4 shrink-0 text-slate-300 transition-colors duration-200 group-hover/card:text-hbt-orange dark:text-white/25 rtl:-scale-x-100" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex h-full min-h-[420px] flex-col overflow-hidden border-s border-slate-100 bg-[#181818] p-6 text-white dark:border-white/10 xl:p-7">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute end-6 top-6 animate-verify-float text-[#F47822]/35"
                  >
                    <GraduationCap className="h-8 w-8" strokeWidth={1.4} />
                  </div>

                  <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                    <div>
                      <p className="flex items-center gap-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        <span
                          aria-hidden="true"
                          className="h-px w-5 bg-[#F47822]"
                        />
                        {t("navigation.bootcampsMenu.eyebrow")}
                      </p>

                      <h3 className="mt-5 max-w-[250px] text-[26px] font-semibold leading-[1.12] tracking-[-0.035em]">
                        {t("navigation.bootcampsMenu.calendarTitle")}
                      </h3>

                      <p className="mt-3 max-w-[270px] text-[11.5px] leading-6 text-white/50">
                        {t("navigation.bootcampsMenu.calendarBody")}
                      </p>
                    </div>

                    <ol className="border-t border-white/10">
                      {[
                        t("navigation.bootcampsMenu.smallCohorts"),
                        t("navigation.bootcampsMenu.liveVehicles"),
                        t("navigation.bootcampsMenu.practicalAssessment"),
                      ].map((item, index) => (
                        <li
                          key={item}
                          className="flex items-center gap-3 border-b border-white/10 py-3.5"
                        >
                          <span className="font-mono text-[9px] font-medium tracking-[0.1em] text-[#F47822]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[11px] font-medium text-white/65">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ol>

                    <div>
                      <Link
                        to="/bootcamps?view=calendar"
                        className="group flex items-center justify-between gap-3 rounded-lg bg-[#F47822] px-4 py-3.5 text-[12px] font-semibold text-white transition-colors duration-200 hover:bg-[#df6817]"
                      >
                        {t("navigation.bootcampsMenu.viewCalendar")}
                        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                      </Link>

                      <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">
                        {t("navigation.bootcampsMenu.footerNote")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
