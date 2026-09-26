"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";
import { CTX } from "@/data/shared/components";
import { MODS } from "@/data/shared/modules";

const AVAIL: { key: "mm" | "scope" | "loc" | "sch"; tag: string; accent: string }[] = [
  { key: "mm", tag: "DMM", accent: "#1F6AE1" },
  { key: "scope", tag: "OSC", accent: "#8B5CF6" },
  { key: "loc", tag: "LOC", accent: "#0E9F6E" },
  { key: "sch", tag: "WDG", accent: "#D92D20" },
];

/** Component picker overlay (03/09 §8.7): 11 components, search, availability chips. */
export function ComponentPicker() {
  const t = useTranslations("shell.picker");
  const tc = useTranslations("shell.context");
  const open = useAppStore((s) => s.pickerOpen);
  const focus = useAppStore((s) => s.focus);
  const api = useAppStoreApi();
  const [q, setQ] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") api.getState().closePicker();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, api]);

  if (!open) return null;

  const list = CTX.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.ref.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-20"
      onClick={() => api.getState().closePicker()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="w-full max-w-lg rounded-xl bg-paper p-4 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="t-section text-ink">{t("title")}</h2>
          <button
            type="button"
            onClick={() => api.getState().closePicker()}
            aria-label={tc("change")}
            className="focus-ring rounded-md p-1 text-neutralx-fg3 hover:bg-fill"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-paper2 px-3">
          <Icon name="search" size={16} className="text-neutralx-fg3" />
          <input
            autoFocus
            dir="ltr"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="h-10 flex-1 bg-transparent t-body-sm outline-none"
          />
        </div>

        <ul className="mt-3 max-h-[52vh] space-y-1 overflow-auto">
          {list.map((c) => {
            const selected = c.ref === focus;
            return (
              <li key={c.ref}>
                <button
                  type="button"
                  onClick={() => api.getState().setFocus(c.ref)}
                  className={cn(
                    "focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors",
                    selected ? "bg-[#FFF6EE]" : "hover:bg-fill",
                  )}
                >
                  <span dir="ltr" className="t-code rounded-xs bg-[rgba(244,120,34,0.16)] px-1.5 py-0.5 text-[#B4560F]">
                    {c.ref}
                  </span>
                  <span className="flex-1">
                    <span className="block t-body-sm font-medium text-ink">{c.name}</span>
                    <span className="block t-eyebrow text-neutralx-fg3">{c.system}</span>
                  </span>
                  <span className="flex gap-1">
                    {AVAIL.map((a) => {
                      const has = c[a.key] != null;
                      return (
                        <span
                          key={a.key}
                          dir="ltr"
                          className={cn("t-code rounded-xs px-1 py-0.5", has ? "text-white" : "bg-fill text-neutralx-fg2")}
                          style={has ? { background: a.accent } : undefined}
                        >
                          {a.tag}
                        </span>
                      );
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
