import type { TFunction } from "i18next";

import {
  BOOTCAMP_CAMPUSES,
  type BootcampDurationUnit,
  type BootcampLevel,
  type BootcampPaymentMethod,
  type BootcampRegistrationStatus,
  type BootcampSite,
} from "../types/bootcamp.types";

const LEVEL_KEYS: Record<string, string> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
  "all levels": "allLevels",
};

export function formatBootcampDuration(
  value: number,
  unit: BootcampDurationUnit,
  t: TFunction,
): string {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 1;

  return t(`bootcampCommon.duration.${unit}`, { value: safeValue });
}

export function formatBootcampLevel(
  level: BootcampLevel,
  t: TFunction,
): string {
  const key = LEVEL_KEYS[String(level)] ?? "allLevels";

  return t(`bootcampCommon.level.${key}`);
}

export function formatBootcampPrice(
  price: number,
  currency: string,
  language: string,
): string {
  try {
    return new Intl.NumberFormat(language === "ar" ? "ar-DZ" : "en-DZ", {
      style: "currency",
      currency: currency || "DZD",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(price)} ${currency || "DZD"}`;
  }
}

export function formatBootcampDate(
  value: string | null | undefined,
  language: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  if (!value) {
    return "";
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "ar" ? "ar-DZ" : "en-GB", options).format(
    date,
  );
}

export function formatBootcampMonth(
  value: string | null | undefined,
  language: string,
): string {
  return formatBootcampDate(value, language, {
    month: "long",
    year: "numeric",
  });
}

export function bootcampSiteLabel(site: BootcampSite, t: TFunction): string {
  return t(`bootcampCommon.site.${site}`);
}

/**
 * Keep bootcamps on the current campus list. Older records used free-text
 * locations, so map the known legacy names onto their nearest campus.
 */
export function normalizeBootcampLocation(location: string): string {
  const value = location.trim();
  const exact = BOOTCAMP_CAMPUSES.find(
    (campus) => campus.location === value,
  );

  if (exact) {
    return exact.location;
  }

  const normalized = value.toLowerCase();

  if (
    normalized.includes("algiers") ||
    normalized.includes("hydra") ||
    normalized.includes("centre") ||
    normalized.includes("center")
  ) {
    return "Algiers Campus";
  }

  if (normalized.includes("saudi")) {
    return "Saudi Campus";
  }

  return BOOTCAMP_CAMPUSES[0].location;
}

export function bootcampPaymentLabel(
  method: BootcampPaymentMethod,
  t: TFunction,
): string {
  return t(`bootcampCommon.payment.${method}`);
}

export function bootcampRegistrationStatusLabel(
  status: BootcampRegistrationStatus,
  t: TFunction,
): string {
  return t(`bootcampCommon.registrationStatus.${status}`);
}
