"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { ASSISTANT_TURNS } from "@/data/scanner";
import type { ScannerScreenProps } from "./types";

/**
 * Diagnostic Assistant (SC, doc 17): the authentic right slide-over drawer in
 * Socratic mode — it poses guiding questions and never hands over the answer.
 * A fixed seed question opens the dialogue; each of 4 turns offers two predefined
 * replies (engine.aiAsk(optId)) that advance to the next scripted HB ASSISTANT
 * response. Deterministic, no free-form input, no external AI. All dialogue prose
 * is Class-C (content.scanner.assist.*); the HB ASSISTANT brand label is canonical.
 *
 * Open state is owned by ScannerView and toggled from the rail's bottom control
 * (as in the original), so this panel is controlled via `open` / `onClose`.
 */
export function AiAssistantPanel({ t, engine, state, open, onClose }: ScannerScreenProps & { open: boolean; onClose: () => void }) {
  const aiOpen = open;
  const tc = useTranslations("content");
  const a = (k: string) => t(`assist.${k}`);
  const turn = state.aiTurn;
  const active = turn < ASSISTANT_TURNS.length ? ASSISTANT_TURNS[turn] : null;

  return (
    <>
      {aiOpen ? (
        <div className="fixed inset-y-0 end-0 z-30 flex w-full max-w-[400px] flex-col border-s border-line bg-paper shadow-panel">
          {/* Dark header */}
          <div className="flex h-[52px] shrink-0 items-center gap-3 bg-[#14181C] px-4 text-[#E8EAED]">
            <TargetIcon />
            <div className="flex-1">
              <div className="t-section leading-tight">{a("title")}</div>
              <div className="t-eyebrow tracking-[0.06em] text-[#9AA0A6]">{a("mode")}</div>
            </div>
            <button type="button" onClick={onClose} aria-label={a("close")} className="focus-ring text-[#9AA0A6]">✕</button>
          </div>

          {/* Conversation */}
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto bg-neutralx-bg2 p-3.5">
            <Bubble who={a("hb")}>{tc("scanner.assist.seed")}</Bubble>
            {state.aiLog.map((m, i) =>
              m.role === "user" ? (
                <Bubble key={i} who={a("you")} me>{tc(`scanner.assist.${m.optId}`)}</Bubble>
              ) : (
                <Bubble key={i} who={a("hb")}>{tc(`scanner.assist.r${m.turn}`)}</Bubble>
              ),
            )}
          </div>

          {/* Reply options */}
          {active ? (
            <div className="shrink-0 border-t border-line bg-paper p-3.5">
              <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{a("yourReply")}</div>
              <div className="mt-2 grid gap-2">
                {active.opts.map((optId) => (
                  <button
                    key={optId}
                    type="button"
                    onClick={() => engine.aiAsk(optId)}
                    className="focus-ring rounded-md border border-line2 px-3 py-2.5 text-start t-body-sm text-ink hover:border-info hover:bg-info-bg"
                  >
                    {tc(`scanner.assist.${optId}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="shrink-0 border-t border-line bg-paper p-3.5">
              <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{a("complete")}</div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

function Bubble({ who, me, children }: { who: string; me?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border px-3.5 py-3", me ? "border-info/40 bg-info-bg" : "border-line2 bg-paper")}>
      <div className="t-eyebrow tracking-[0.12em] text-neutralx-fg3">{who}</div>
      <div className="mt-2 t-body-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}

function TargetIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F47822" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2M12 19v2M4.5 12H3M21 12h-1.5" />
    </svg>
  );
}
