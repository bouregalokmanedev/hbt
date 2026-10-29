import {
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { HoneypotField } from "@/features/security/HoneypotField";
import { TurnstileWidget } from "@/features/security/TurnstileWidget";
import { ApiError } from "@/lib/api/errors";

import { bootcampsApi } from "../api/bootcamps.api";
import type {
  Bootcamp,
  BootcampPaymentMethod,
  BootcampRegistration,
  BootcampSite,
} from "../types/bootcamp.types";
import {
  BOOTCAMP_PAYMENT_METHODS,
  BOOTCAMP_SITES,
} from "../types/bootcamp.types";
import {
  bootcampPaymentLabel,
  bootcampSiteLabel,
  formatBootcampDate,
  formatBootcampPrice,
} from "../utils/bootcampFormat";

interface BootcampRegistrationFormProps {
  bootcamp: Bootcamp;
}

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  scheduleId: string;
  site: BootcampSite;
  paymentMethod: BootcampPaymentMethod;
  termsAccepted: boolean;
  website: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

function scheduleRange(schedule: Bootcamp["schedules"][number], language: string): string {
  const start = formatBootcampDate(schedule.starts_at, language, {
    day: "numeric",
    month: "long",
  });
  const end = formatBootcampDate(schedule.ends_at, language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${start} – ${end}`;
}

export function BootcampRegistrationForm({
  bootcamp,
}: BootcampRegistrationFormProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const { user } = useAuth();

  const availableSchedules = useMemo(
    () => bootcamp.schedules.filter((schedule) => schedule.is_available),
    [bootcamp.schedules],
  );

  const [values, setValues] = useState<FormValues>(() => ({
    firstName: user?.first_name ?? "",
    lastName: user?.last_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    scheduleId: availableSchedules[0]?.id ?? "",
    site: BOOTCAMP_SITES[0],
    paymentMethod: BOOTCAMP_PAYMENT_METHODS[0],
    termsAccepted: false,
    website: "",
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registration, setRegistration] =
    useState<BootcampRegistration | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};

    if (!values.firstName.trim()) {
      next.firstName = t("bootcampDetails.form.required");
    }
    if (!values.lastName.trim()) {
      next.lastName = t("bootcampDetails.form.required");
    }
    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = t("bootcampDetails.form.required");
    }
    if (!values.phone.trim()) {
      next.phone = t("bootcampDetails.form.required");
    }
    if (!values.scheduleId) {
      next.scheduleId = t("bootcampDetails.form.scheduleRequired");
    }
    if (!values.termsAccepted) {
      next.termsAccepted = t("bootcampDetails.form.termsRequired");
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validation = validate();

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setSubmitError(null);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await bootcampsApi.register(bootcamp.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        scheduleId: values.scheduleId,
        site: values.site,
        paymentMethod: values.paymentMethod,
        termsAccepted: values.termsAccepted,
        website: values.website,
        turnstileToken,
      });

      setRegistration(created);
      setErrors({});
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.errors) {
        const fieldErrors: FormErrors = {};

        Object.entries(requestError.errors).forEach(([field, messages]) => {
          const mapped: Partial<Record<string, keyof FormValues>> = {
            first_name: "firstName",
            last_name: "lastName",
            email: "email",
            phone: "phone",
            schedule_id: "scheduleId",
            terms_accepted: "termsAccepted",
          };
          const key = mapped[field];

          if (key && messages[0]) {
            fieldErrors[key] = messages[0];
          }
        });

        setErrors(fieldErrors);
      }

      setSubmitError(
        requestError instanceof Error
          ? requestError.message
          : t("bootcampDetails.form.errorFallback"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setRegistration(null);
    setValues((current) => ({
      ...current,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      termsAccepted: false,
    }));
    setErrors({});
    setSubmitError(null);
    setTurnstileToken(null);
  }

  if (availableSchedules.length === 0) {
    return (
      <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_8px_28px_rgba(58,58,58,0.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
          <CalendarDays className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
          {t("bootcampDetails.hero.registerTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
          {t("bootcampDetails.hero.registrationClosed")}
        </p>
      </section>
    );
  }

  if (registration) {
    const scheduled = availableSchedules.find(
      (schedule) => schedule.id === registration.bootcamp_schedule_id,
    );

    return (
      <section
        className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-[0_8px_28px_rgba(16,185,129,0.08)] dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:p-8"
        data-testid="bootcamp-registration-success"
        aria-live="polite"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-200">
          {t("bootcampDetails.form.successTitle")}
        </h2>

        <p className="mt-2 max-w-lg text-sm leading-7 text-emerald-900/70 dark:text-emerald-100/70">
          {t("bootcampDetails.form.successBody", {
            title: bootcamp.title,
          })}
        </p>

        {scheduled && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-900 dark:bg-black/20 dark:text-emerald-100">
            <CalendarCheck2 className="h-4 w-4" />
            {t("bootcampDetails.form.successSchedule", {
              dates: scheduleRange(scheduled, language),
            })}
          </p>
        )}

        <p className="mt-4 flex items-center gap-2 text-[11px] text-emerald-900/60 dark:text-emerald-100/60">
          <Clock3 className="h-3.5 w-3.5" />
          {t("bootcampDetails.enroll.confirmNote")}
        </p>

        <button
          type="button"
          onClick={resetForm}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-800"
        >
          {t("bootcampDetails.form.another")}
        </button>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_28px_rgba(58,58,58,0.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-7"
      data-testid="bootcamp-registration-form"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
            <Sparkles className="h-3 w-3" />
            {t("bootcampDetails.form.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
            {t("bootcampDetails.form.title")}
          </h2>
          <p className="mt-2 max-w-md text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
            {t("bootcampDetails.hero.registerDescription")}
          </p>
        </div>

        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
          <CalendarDays className="h-5 w-5" />
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("bootcampDetails.form.firstName")}
            value={values.firstName}
            onChange={(value) => update("firstName", value)}
            error={errors.firstName}
            placeholder={t("bootcampDetails.form.firstNamePh")}
            autoComplete="given-name"
            required
          />
          <Field
            label={t("bootcampDetails.form.lastName")}
            value={values.lastName}
            onChange={(value) => update("lastName", value)}
            error={errors.lastName}
            placeholder={t("bootcampDetails.form.lastNamePh")}
            autoComplete="family-name"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("bootcampDetails.form.email")}
            type="email"
            value={values.email}
            onChange={(value) => update("email", value)}
            error={errors.email}
            placeholder={t("bootcampDetails.form.emailPh")}
            autoComplete="email"
            required
          />
          <Field
            label={t("bootcampDetails.form.phone")}
            type="tel"
            value={values.phone}
            onChange={(value) => update("phone", value)}
            error={errors.phone}
            placeholder={t("bootcampDetails.form.phonePh")}
            autoComplete="tel"
            required
          />
        </div>

        <fieldset>
          <legend className="text-[11px] font-bold text-[#3A3A3A] dark:text-[#ececef]">
            {t("bootcampDetails.form.scheduleLabel")}
          </legend>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {availableSchedules.map((schedule) => {
              const checked = values.scheduleId === schedule.id;

              return (
                <label
                  key={schedule.id}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3.5 transition",
                    checked
                      ? "border-[#F47822] bg-[#F47822]/5 ring-1 ring-[#F47822]/20"
                      : "border-[#3A3A3A]/10 bg-[#FCFCFC] hover:border-[#F47822]/35 dark:border-white/10 dark:bg-[#101013]",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="schedule_id"
                    value={schedule.id}
                    checked={checked}
                    onChange={() => update("scheduleId", schedule.id)}
                    className="mt-1 h-4 w-4 accent-[#F47822]"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                      {scheduleRange(schedule, language)}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                      <MapPin className="h-3 w-3 text-[#F47822]" />
                      {bootcamp.location}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {errors.scheduleId && (
            <p className="mt-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
              {errors.scheduleId}
            </p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-bold text-[#3A3A3A] dark:text-[#ececef]">
              {t("bootcampDetails.form.siteLabel")}
            </span>
            <select
              value={values.site}
              onChange={(event) =>
                update("site", event.target.value as BootcampSite)
              }
              className="mt-1.5 h-12 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]"
            >
              {BOOTCAMP_SITES.map((site) => (
                <option key={site} value={site}>
                  {bootcampSiteLabel(site, t)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-bold text-[#3A3A3A] dark:text-[#ececef]">
              {t("bootcampDetails.form.paymentLabel")}
            </span>
            <select
              value={values.paymentMethod}
              onChange={(event) =>
                update(
                  "paymentMethod",
                  event.target.value as BootcampPaymentMethod,
                )
              }
              className="mt-1.5 h-12 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]"
            >
              {BOOTCAMP_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {bootcampPaymentLabel(method, t)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-[#3A3A3A]/8 bg-[#F7F7F7] px-4 py-3.5 dark:border-white/8 dark:bg-[#101013]">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[#3A3A3A]/50 dark:text-white/50">
              {t("bootcampDetails.form.paymentLabel")}
            </span>
            <span className="font-semibold text-[#3A3A3A] dark:text-[#ececef]">
              {bootcampPaymentLabel(values.paymentMethod, t)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#3A3A3A]/8 pt-2 text-[11px] dark:border-white/8">
            <span className="text-[#3A3A3A]/50 dark:text-white/50">
              {t("bootcampDetails.hero.priceLabel")}
            </span>
            <span className="text-base font-black text-[#3A3A3A] dark:text-[#ececef]">
              {formatBootcampPrice(
                bootcamp.price,
                bootcamp.currency,
                language,
              )}
            </span>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={values.termsAccepted}
            onChange={(event) =>
              update("termsAccepted", event.target.checked)
            }
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#F47822]"
            aria-invalid={Boolean(errors.termsAccepted)}
          />
          <span className="text-[11px] leading-5 text-[#3A3A3A]/60 dark:text-white/60">
            {t("bootcampDetails.form.termsPrefix")}{" "}
            <Link
              to="/terms"
              className="font-bold text-[#F47822] underline-offset-2 hover:underline"
            >
              {t("bootcampDetails.form.termsLink")}
            </Link>{" "}
            {t("bootcampDetails.form.termsSuffix")}
          </span>
        </label>

        {errors.termsAccepted && (
          <p className="text-[11px] font-medium text-red-600 dark:text-red-400">
            {errors.termsAccepted}
          </p>
        )}

        <HoneypotField
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />

        <TurnstileWidget onToken={setTurnstileToken} />

        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
          >
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition hover:-translate-y-0.5 hover:bg-[#de6414] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <BadgeCheck className="h-4 w-4" />
          )}
          {isSubmitting
            ? t("bootcampDetails.form.submitting")
            : t("bootcampDetails.form.submit")}
        </button>

        <p className="flex items-start gap-2 text-[10px] leading-4 text-[#3A3A3A]/35 dark:text-white/35">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />
          {t("bootcampDetails.form.privacyNote")}
        </p>
      </form>
    </section>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  required,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-[#3A3A3A] dark:text-[#ececef]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        className={[
          "mt-1.5 h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-[#3A3A3A] outline-none transition focus:ring-4 dark:bg-[#101013] dark:text-[#ececef]",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-500/40 dark:focus:ring-red-500/10"
            : "border-[#3A3A3A]/12 focus:border-[#F47822] focus:ring-[#F47822]/10 dark:border-white/12",
        ].join(" ")}
      />
      {error && (
        <span className="mt-1 block text-[11px] font-medium text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}
