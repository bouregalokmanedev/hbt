import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  CircuitBoard,
  Route,
  Sparkles,
  Wrench,
} from "lucide-react";
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

import { cn } from "@/lib/cn";

interface SimulatorMegaMenuProps {
  navLinkClass: (args: { isActive: boolean }) => string;
  simulatorHref: string;
  mentorHref: string;
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

export function SimulatorMegaMenu({
  navLinkClass,
  simulatorHref,
  mentorHref,
}: SimulatorMegaMenuProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<PanelGeometry>({
    left: 0,
    top: 0,
    width: PANEL_MAX_WIDTH,
  });

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const features = [
    {
      key: "missions",
      icon: Route,
      title: t("navigation.simulatorMenu.features.missions.title"),
      description: t("navigation.simulatorMenu.features.missions.description"),
    },
    {
      key: "schematics",
      icon: CircuitBoard,
      title: t("navigation.simulatorMenu.features.schematics.title"),
      description: t(
        "navigation.simulatorMenu.features.schematics.description",
      ),
    },
    {
      key: "faults",
      icon: Wrench,
      title: t("navigation.simulatorMenu.features.faults.title"),
      description: t("navigation.simulatorMenu.features.faults.description"),
    },
  ];

  const mentorSteps = [
    t("navigation.simulatorMenu.mentor.steps.ask"),
    t("navigation.simulatorMenu.mentor.steps.next"),
    t("navigation.simulatorMenu.mentor.steps.review"),
  ];

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
      const headerRect = trigger.closest("header")?.getBoundingClientRect();

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
        to={simulatorHref}
        className={navLinkClass}
        onClick={closeMenu}
        aria-expanded={open}
        aria-controls="simulator-mega-menu"
      >
        {({ isActive }) => (
          <>
            <span className="inline-flex items-center gap-1.5">
              {t("navigation.simulator")}
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
          id="simulator-mega-menu"
          role="region"
          aria-label={t("navigation.simulatorMenu.label")}
          data-testid="simulator-mega-menu"
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
              <div className="grid grid-cols-2 lg:h-[520px]">
                {/* =================================================
                    SIMULATOR LAB
                ================================================== */}

                <div
                  data-testid="simulator-mega-card"
                  className="flex h-full min-w-0 flex-col border-e border-slate-100 p-6 dark:border-white/10 xl:p-7"
                >
                  <div>
                    <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-hbt-orange">
                      <span
                        aria-hidden="true"
                        className="h-px w-5 bg-hbt-orange"
                      />
                      {t("navigation.simulatorMenu.eyebrow")}
                    </p>

                    <h3 className="mt-4 max-w-[360px] text-[26px] font-semibold leading-[1.12] tracking-[-0.035em] text-hbt-dark dark:text-[#ececef]">
                      {t("navigation.simulatorMenu.title")}
                    </h3>

                    <p className="mt-2.5 max-w-[380px] text-[11.5px] leading-6 text-slate-500 dark:text-white/45">
                      {t("navigation.simulatorMenu.description")}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-1 flex-col gap-2">
                    {features.map((feature) => (
                      <Link
                        key={feature.key}
                        to={simulatorHref}
                        className="group/feature flex min-w-0 items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-hbt-orange/40 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-hbt-orange/40"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4EC] text-hbt-orange dark:bg-[#F47822]/10">
                          <feature.icon className="h-5 w-5" strokeWidth={1.7} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-hbt-dark transition-colors group-hover/feature:text-hbt-orange dark:text-[#ececef]">
                            {feature.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[10.5px] leading-5 text-slate-500 dark:text-white/45">
                            {feature.description}
                          </span>
                        </span>

                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors duration-200 group-hover/feature:text-hbt-orange dark:text-white/25 rtl:-scale-x-100" />
                      </Link>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Link
                      to={simulatorHref}
                      className="group flex items-center justify-between gap-3 rounded-lg bg-[#F47822] px-4 py-3.5 text-[12px] font-semibold text-white transition-colors duration-200 hover:bg-[#df6817]"
                    >
                      {t("navigation.simulatorMenu.open")}
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                    </Link>

                    <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.16em] text-slate-400 dark:text-white/30">
                      {t("navigation.simulatorMenu.footerNote")}
                    </p>
                  </div>
                </div>

                {/* =================================================
                    AI MENTOR
                ================================================== */}

                <div
                  data-testid="simulator-mega-mentor"
                  className="relative flex h-full min-w-0 flex-col overflow-hidden bg-[#181818] p-6 text-white xl:p-7"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute end-6 top-6 animate-verify-float text-[#F47822]/35"
                  >
                    <Sparkles className="h-8 w-8" strokeWidth={1.4} />
                  </div>

                  <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                    <div>
                      <p className="flex items-center gap-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        <span
                          aria-hidden="true"
                          className="h-px w-5 bg-[#F47822]"
                        />
                        {t("navigation.simulatorMenu.mentor.eyebrow")}
                      </p>

                      <h3 className="mt-5 max-w-[300px] text-[26px] font-semibold leading-[1.12] tracking-[-0.035em]">
                        {t("navigation.simulatorMenu.mentor.title")}
                      </h3>

                      <p className="mt-3 max-w-[320px] text-[11.5px] leading-6 text-white/50">
                        {t("navigation.simulatorMenu.mentor.description")}
                      </p>
                    </div>

                    <ol className="border-t border-white/10">
                      {mentorSteps.map((step, index) => (
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
                        to={mentorHref}
                        className="group flex items-center justify-between gap-3 rounded-lg bg-[#F47822] px-4 py-3.5 text-[12px] font-semibold text-white transition-colors duration-200 hover:bg-[#df6817]"
                      >
                        {t("navigation.simulatorMenu.mentor.open")}
                        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                      </Link>

                      <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">
                        {t("navigation.simulatorMenu.mentor.footerNote")}
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
