"use client";

import { useTranslations } from "next-intl";
import { DEVICE_BUTTONS, DEVICE_CROP, DEVICE_IMAGE } from "../data/device";
import type { ScannerScreen } from "../screens/types";

/**
 * Diagnostic-tablet front panel on SC-01: the device art with transparent
 * hit-boxes over its home-screen buttons (geometry in data/device.ts, measured
 * from the 1000×1000 art). Captions are burned into the image (Class B);
 * localized aria-labels come from `scanner.device.btn.*`.
 * The art is a technical island — always LTR, even under RTL locales.
 */
export function DevicePanel({
  go,
  onAssistant,
}: {
  go: (s: ScannerScreen) => void;
  onAssistant?: () => void;
}) {
  const t = useTranslations("scanner");
  // Container height = DEVICE_CROP.height% of the image → express the full
  // image (and the crop offset) as a % of the container.
  const scale = (100 * 100) / DEVICE_CROP.height;
  const offsetY = (-DEVICE_CROP.top * 100) / DEVICE_CROP.height;

  return (
    <section className="mt-4" dir="ltr">
      <div className="mx-auto max-w-[900px]">
        <div className="flex items-baseline justify-between">
          <div className="t-eyebrow text-neutralx-fg3">{t("device.kicker")}</div>
          <div className="t-code text-neutralx-fg3">{t("device.hint")}</div>
        </div>

        <div className="relative mt-2 aspect-[1000/540] overflow-hidden rounded-xl border border-line bg-paper shadow-card">
          {/* Full-image layer: art + hit-boxes share one coordinate space. */}
          <div className="absolute left-0 w-full" style={{ top: `${offsetY}%`, height: `${scale}%` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DEVICE_IMAGE}
              alt=""
              draggable={false}
              className="block h-full w-full select-none"
            />
            {DEVICE_BUTTONS.map((b) => {
              const label = t(`device.btn.${b.id}`);
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => (b.action === "assistant" ? onAssistant?.() : b.route && go(b.route))}
                  style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                  className="focus-ring absolute cursor-pointer rounded-md transition hover:bg-white/15 hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.85)] active:scale-[0.99]"
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
