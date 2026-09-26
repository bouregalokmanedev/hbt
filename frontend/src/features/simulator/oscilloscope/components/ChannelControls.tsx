import clsx from "clsx";
import type { ScopeEngine, ScopeEngineState } from "../engine/scope.engine";

/** Per-channel controls: V/div (±), coupling DC/AC, invert, vertical offset (±). */
export function ChannelControls({
  engine,
  state,
  t,
}: {
  engine: ScopeEngine;
  state: ScopeEngineState;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const comp = engine.comp();
  const row = (ch: "A" | "B") => {
    const cfg = ch === "A" ? comp.chA : comp.chB!;
    const vdiv = ch === "A" ? state.vdivA : state.vdivB;
    const off = ch === "A" ? state.offA : state.offB;
    const cpl = ch === "A" ? state.couplingA : state.couplingB;
    const inv = ch === "A" ? state.invA : state.invB;
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#1b1b20]">
        <span className={clsx("font-mono text-xs font-black", ch === "A" ? "text-[#0E9F6E]" : "text-[#1F6AE1]")}>
          {ch === "A"
            ? (t("oscilloscope.channel.a", { defaultValue: "Ch A" }) as string)
            : (t("oscilloscope.channel.b", { defaultValue: "Ch B" }) as string)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-[#3A3A3A]/60 dark:text-white/60">{cfg.label}</span>
        <div className="inline-flex items-center gap-1 rounded-md border border-[#3A3A3A]/10 bg-[#F8F7F6] px-1 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => engine.setVdiv(ch, vdiv / 2)}
            aria-label="v-down"
            className="px-1.5 font-mono text-[#3A3A3A] focus:outline-none dark:text-white"
          >
            −
          </button>
          <span dir="ltr" className="min-w-16 text-center font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
            {vdiv} {cfg.unit}/div
          </span>
          <button
            type="button"
            onClick={() => engine.setVdiv(ch, vdiv * 2)}
            aria-label="v-up"
            className="px-1.5 font-mono text-[#3A3A3A] focus:outline-none dark:text-white"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => engine.setCoupling(ch, cpl === "DC" ? "AC" : "DC")}
          className="rounded-md border border-[#3A3A3A]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#3A3A3A] focus:outline-none dark:border-white/10 dark:text-white"
        >
          {cpl}
        </button>
        <button
          type="button"
          onClick={() => engine.toggleInvert(ch)}
          className={clsx(
            "rounded-md border px-2 py-0.5 font-mono text-xs font-bold focus:outline-none",
            inv ? "border-[#0E9F6E] text-[#0E9F6E]" : "border-[#3A3A3A]/10 text-[#3A3A3A] dark:border-white/10 dark:text-white",
          )}
        >
          {t("oscilloscope.control.invert", { defaultValue: "Invert" }) as string}
        </button>
        <div className="inline-flex items-center gap-1 rounded-md border border-[#3A3A3A]/10 bg-[#F8F7F6] px-1 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => engine.setOffset(ch, off - 0.5)}
            aria-label="off-down"
            className="px-1.5 font-mono text-[#3A3A3A] focus:outline-none dark:text-white"
          >
            ↓
          </button>
          <span dir="ltr" className="min-w-12 text-center font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
            {off.toFixed(1)} div
          </span>
          <button
            type="button"
            onClick={() => engine.setOffset(ch, off + 0.5)}
            aria-label="off-up"
            className="px-1.5 font-mono text-[#3A3A3A] focus:outline-none dark:text-white"
          >
            ↑
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {row("A")}
      {comp.chB ? row("B") : null}
    </div>
  );
}
