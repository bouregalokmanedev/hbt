"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { RailNav } from "./RailNav";
import { TopBar } from "./TopBar";
import { ToastHost } from "./ToastHost";
import { ComponentPicker } from "./ComponentPicker";
import { useViewportTracker } from "@/lib/useBreakpoint";

/** Persistent in-app chrome (02 global chrome). Rail + top bar + content slot. */
export function AppShell({ children }: { children: React.ReactNode }) {
  useViewportTracker();
  const t = useTranslations("shell");
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  // Move focus to the content region on route change (10 §17). Skip the very
  // first mount so we don't steal focus on load.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-shell-bg">
      <a
        href="#main-content"
        className="focus-ring absolute start-2 top-2 z-50 -translate-y-20 rounded-md bg-brand px-3 py-2 t-cta text-brand-on transition-transform focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <RailNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex min-h-0 flex-1 flex-col overflow-auto bg-paper2 outline-none"
        >
          {children}
        </main>
      </div>
      <ToastHost />
      <ComponentPicker />
    </div>
  );
}
