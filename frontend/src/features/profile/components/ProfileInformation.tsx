
import { useState } from "react";

import { useTranslation } from "react-i18next";

import {
    Clock3,
    Edit3,
    Globe2,
    Languages,
    Mail,
    MapPin,
    Phone,
    Save,
    Send,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";

import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth";
import type { User } from "@/features/auth/types/auth.types";

import type { ProfileFormData } from "../pages/ProfilePage";
import { COUNTRIES } from "../constants/countries";

interface ProfileInformationProps {
    user: User;
    form: ProfileFormData;
    isEditing: boolean;
    isSaving: boolean;

    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;

    onFieldChange: <
        K extends keyof ProfileFormData
    >(
        field: K,
        value: ProfileFormData[K],
    ) => void;
}

const LANGUAGE_KEYS: Record<string, string> = {
    en: "profilePage.info.langEnglish",
    fr: "profilePage.info.langFrench",
    ar: "profilePage.info.langArabic",
    es: "profilePage.info.langSpanish",
    de: "profilePage.info.langGerman",
};

const LANGUAGES = [
    { value: "en", key: "profilePage.info.langEnglish" },
    { value: "fr", key: "profilePage.info.langFrench" },
    { value: "ar", key: "profilePage.info.langArabic" },
    { value: "es", key: "profilePage.info.langSpanish" },
    { value: "de", key: "profilePage.info.langGerman" },
];

const TIMEZONES = [
    {
        value: "Africa/Algiers",
        label: "Algiers — UTC+01:00",
    },
    {
        value: "Europe/Paris",
        label: "Paris — UTC+01:00",
    },
    {
        value: "Europe/London",
        label: "London — UTC+00:00",
    },
    {
        value: "Europe/Berlin",
        label: "Berlin — UTC+01:00",
    },
    {
        value: "Europe/Rome",
        label: "Rome — UTC+01:00",
    },
    {
        value: "Europe/Madrid",
        label: "Madrid — UTC+01:00",
    },
    {
        value: "America/New_York",
        label: "New York — UTC-05:00",
    },
    {
        value: "America/Los_Angeles",
        label: "Los Angeles — UTC-08:00",
    },
    {
        value: "America/Toronto",
        label: "Toronto — UTC-05:00",
    },
    {
        value: "Asia/Dubai",
        label: "Dubai — UTC+04:00",
    },
    {
        value: "Asia/Riyadh",
        label: "Riyadh — UTC+03:00",
    },
    {
        value: "Asia/Kolkata",
        label: "India — UTC+05:30",
    },
    {
        value: "Asia/Tokyo",
        label: "Tokyo — UTC+09:00",
    },
    {
        value: "Asia/Shanghai",
        label: "Shanghai — UTC+08:00",
    },
    {
        value: "Australia/Sydney",
        label: "Sydney — UTC+10:00",
    },
];

const inputClassName = `
    mt-2
    h-12
    w-full
    rounded-xl
    border
    border-[#3A3A3A]/8 dark:border-white/8
    bg-[#FAFAFA] dark:bg-[#232329]
    px-4
    text-sm
    text-[#3A3A3A] dark:text-[#ececef]
    outline-none
    transition
    placeholder:text-[#3A3A3A]/25 dark:placeholder:text-white/25
    focus:border-[#F47822]/40
    focus:bg-white dark:focus:bg-[#1b1b20]
    focus:ring-4
    focus:ring-[#F47822]/5
`;

const readOnlyClassName = `
    mt-2
    flex
    min-h-12
    items-center
    rounded-xl
    border
    border-[#3A3A3A]/6 dark:border-white/6
    bg-[#FAFAFA] dark:bg-[#232329]
    px-4
    text-sm
    text-[#3A3A3A]/70 dark:text-white/70
`;

interface FieldProps {
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
}

function Field({
    icon: Icon,
    label,
    children,
}: FieldProps) {
    return (
        <div>
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#3A3A3A]/35 dark:text-white/35" />

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/45 dark:text-white/45">
                    {label}
                </p>
            </div>

            {children}
        </div>
    );
}

export function ProfileInformation({
    user,
    form,
    isEditing,
    isSaving,
    onEdit,
    onCancel,
    onSave,
    onFieldChange,
}: ProfileInformationProps) {
    const { t } = useTranslation();

    const updateUser = useAuthStore((state) => state.updateUser);

    const [otpOpen, setOtpOpen] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [otpBusy, setOtpBusy] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpNotice, setOtpNotice] = useState<string | null>(null);

    const phoneVerified = Boolean(user.phone_verified_at);
    const hasPhone = Boolean(user.phone);

    const badgeClass = phoneVerified
        ? "inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
        : "inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700";
    const badgeLabel = phoneVerified
        ? t("profilePage.info.verified")
        : t("profilePage.info.notVerified");

    const closeOtp = () => {
        setOtpOpen(false);
        setOtpCode("");
        setOtpError(null);
        setOtpNotice(null);
    };

    const startPhoneVerification = async () => {
        if (otpBusy) return;

        setOtpOpen(true);
        setOtpError(null);
        setOtpNotice(null);
        setOtpCode("");
        setOtpBusy(true);

        try {
            const result = await authApi.sendPhoneOtp();

            if (result.phone_verified_at) {
                setOtpOpen(false);
                setOtpNotice(t("profilePage.info.phoneVerify.already"));
                return;
            }

            setOtpNotice(
                result.delivery === "sms"
                    ? t("profilePage.info.phoneVerify.sentSms", {
                          phone: user.phone ?? "",
                      })
                    : t("profilePage.info.phoneVerify.sentEmail"),
            );
        } catch (cause) {
            setOtpError(
                cause instanceof Error
                    ? cause.message
                    : t("profilePage.info.phoneVerify.sendFailed"),
            );
        } finally {
            setOtpBusy(false);
        }
    };

    const submitPhoneCode = async () => {
        if (otpBusy || otpCode.length !== 6) return;

        setOtpBusy(true);
        setOtpError(null);

        try {
            const result = await authApi.verifyPhoneOtp(otpCode);

            updateUser({
                ...user,
                phone_verified_at: result.phone_verified_at,
            });
            setOtpOpen(false);
            setOtpCode("");
            setOtpNotice(t("profilePage.info.phoneVerify.success"));
        } catch (cause) {
            setOtpError(
                cause instanceof Error
                    ? cause.message
                    : t("profilePage.info.phoneVerify.invalid"),
            );
        } finally {
            setOtpBusy(false);
        }
    };

    const languageLabel = (value: string | null | undefined): string => {
        if (!value) return "—";
        const key = LANGUAGE_KEYS[value];
        return key ? t(key) : value;
    };

    return (
        <section className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-[#3A3A3A]/6 dark:border-white/6 px-5 py-4 sm:px-6">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        {t("profilePage.info.eyebrow")}
                    </p>

                    <h2 className="mt-1 text-base font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                        {t("profilePage.info.title")}
                    </h2>
                </div>

                {!isEditing && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#3A3A3A]/8 dark:border-white/8 px-3 text-xs font-semibold text-[#3A3A3A]/65 dark:text-white/65 transition hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822]"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                        {t("profilePage.info.edit")}
                    </button>
                )}
            </div>

            {/* Fields */}

            <div className="grid gap-x-6 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-6">
                {/* First name */}

                <Field icon={UserRound} label={t("profilePage.info.firstName")}>
                    {isEditing ? (
                        <input
                            value={form.first_name}
                            onChange={(event) =>
                                onFieldChange(
                                    "first_name",
                                    event.target.value,
                                )
                            }
                            className={inputClassName}
                        />
                    ) : (
                        <div className={readOnlyClassName}>
                            {user.first_name || "—"}
                        </div>
                    )}
                </Field>

                {/* Last name */}

                <Field icon={UserRound} label={t("profilePage.info.lastName")}>
                    {isEditing ? (
                        <input
                            value={form.last_name}
                            onChange={(event) =>
                                onFieldChange(
                                    "last_name",
                                    event.target.value,
                                )
                            }
                            className={inputClassName}
                        />
                    ) : (
                        <div className={readOnlyClassName}>
                            {user.last_name || "—"}
                        </div>
                    )}
                </Field>

                {/* Username */}

                <Field icon={UserRound} label={t("profilePage.info.username")}>
                    {isEditing ? (
                        <input
                            value={form.username}
                            onChange={(event) =>
                                onFieldChange(
                                    "username",
                                    event.target.value,
                                )
                            }
                            className={inputClassName}
                        />
                    ) : (
                        <div className={readOnlyClassName}>
                            @{user.username || "—"}
                        </div>
                    )}
                </Field>

                {/* Email - always readonly */}

                <Field icon={Mail} label={t("profilePage.info.email")}>
                    <div className="relative">
                        <div className={`${readOnlyClassName} pe-24`}>
                            {user.email || "—"}
                        </div>

                        <span
                            className={
                                user.email_verified_at
                                    ? "absolute end-3 top-1/2 -translate-y-1/2 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                                    : "absolute end-3 top-1/2 -translate-y-1/2 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700"
                            }
                        >
                            {user.email_verified_at
                                ? t("profilePage.info.verified")
                                : t("profilePage.info.notVerified")}
                        </span>
                    </div>
                </Field>

                {/* Phone */}

                <Field icon={Phone} label={t("profilePage.info.phone")}>
                    {isEditing ? (
                        <div className="mt-2 flex gap-2">
                            <select
                                value={form.phone_country_code}
                                onChange={(event) =>
                                    onFieldChange(
                                        "phone_country_code",
                                        event.target.value,
                                    )
                                }
                                className="
                                    h-12
                                    w-[105px]
                                    shrink-0
                                    rounded-xl
                                    border
                                    border-[#3A3A3A]/8 dark:border-white/8
                                    bg-[#FAFAFA] dark:bg-[#232329]
                                    px-3
                                    text-sm
                                    font-medium
                                    text-[#3A3A3A] dark:text-[#ececef]
                                    outline-none
                                    transition
                                    focus:border-[#F47822]/40
                                    focus:bg-white dark:focus:bg-[#1b1b20]
                                    focus:ring-4
                                    focus:ring-[#F47822]/5
                                "
                            >
                                {COUNTRIES.map((country) => (
                                    <option
                                        key={`${country.code}-${country.dialCode}`}
                                        value={country.dialCode}
                                    >
                                        {country.dialCode}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(event) =>
                                    onFieldChange(
                                        "phone",
                                        event.target.value,
                                    )
                                }
                                placeholder={t("profilePage.info.phonePh")}
                                className="
                                    h-12
                                    min-w-0
                                    flex-1
                                    rounded-xl
                                    border
                                    border-[#3A3A3A]/8 dark:border-white/8
                                    bg-[#FAFAFA] dark:bg-[#232329]
                                    px-4
                                    text-sm
                                    text-[#3A3A3A] dark:text-[#ececef]
                                    outline-none
                                    transition
                                    placeholder:text-[#3A3A3A]/25 dark:placeholder:text-white/25
                                    focus:border-[#F47822]/40
                                    focus:bg-white dark:focus:bg-[#1b1b20]
                                    focus:ring-4
                                    focus:ring-[#F47822]/5
                                "
                            />
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <div className={`${readOnlyClassName} pe-24`}>
                                    {user.phone || "—"}
                                </div>

                                {hasPhone && (
                                    <span className={`${badgeClass} absolute end-3 top-1/2 -translate-y-1/2`}>
                                        {badgeLabel}
                                    </span>
                                )}
                            </div>

                            {hasPhone && !phoneVerified && (
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void startPhoneVerification()
                                        }
                                        disabled={otpBusy}
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-lg
                                            bg-[#F47822]/10
                                            px-3
                                            py-1.5
                                            text-[11px]
                                            font-bold
                                            text-[#F47822]
                                            transition
                                            hover:bg-[#F47822]/15
                                            disabled:opacity-50
                                        "
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        {otpBusy
                                            ? t(
                                                  "profilePage.info.phoneVerify.sending",
                                              )
                                            : t(
                                                  "profilePage.info.phoneVerify.verify",
                                              )}
                                    </button>
                                </div>
                            )}

                            {otpNotice && !otpOpen && (
                                <p
                                    className={
                                        phoneVerified
                                            ? "mt-1.5 text-[11px] font-medium text-emerald-700"
                                            : "mt-1.5 text-[11px] font-medium text-[#3A3A3A]/55"
                                    }
                                >
                                    {otpNotice}
                                </p>
                            )}
                        </>
                    )}

                    {isEditing && hasPhone && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={badgeClass}>{badgeLabel}</span>
                        </div>
                    )}
                </Field>

                {/* Country */}

                <Field icon={MapPin} label={t("profilePage.info.country")}>
                    {isEditing ? (
                        <select
                            value={form.country}
                            onChange={(event) =>
                                onFieldChange(
                                    "country",
                                    event.target.value,
                                )
                            }
                            className={inputClassName}
                        >
                            <option value="">
                                {t("profilePage.info.selectCountry")}
                            </option>

                            {COUNTRIES.map((country) => (
                                <option
                                    key={country.code}
                                    value={country.name}
                                >
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className={readOnlyClassName}>
                            {user.country || "—"}
                        </div>
                    )}
                </Field>

                {/* Language */}

                <Field icon={Languages} label={t("profilePage.info.language")}>
                    {isEditing ? (
                        <select
                            value={form.language}
                            onChange={(event) =>
                                onFieldChange(
                                    "language",
                                    event.target.value,
                                )
                            }
                            className={inputClassName}
                        >
                            {LANGUAGES.map((language) => (
                                <option
                                    key={language.value}
                                    value={language.value}
                                >
                                    {t(language.key)}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className={readOnlyClassName}>
                            {languageLabel(user.language)}
                        </div>
                    )}
                </Field>

                {/* Timezone */}

                <Field icon={Clock3} label={t("profilePage.info.timezone")}>
                    {isEditing ? (
                        <select
                            value={form.timezone}
                            onChange={(event) =>
                                onFieldChange(
                                    "timezone",
                                    event.target.value,
                                )
                            }
                            className={inputClassName}
                        >
                            {TIMEZONES.map((timezone) => (
                                <option
                                    key={timezone.value}
                                    value={timezone.value}
                                >
                                    {timezone.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className={readOnlyClassName}>
                            {TIMEZONES.find(
                                (timezone) =>
                                    timezone.value ===
                                    user.timezone,
                            )?.label ??
                                user.timezone ??
                                "—"}
                        </div>
                    )}
                </Field>
            </div>

            {/* Phone verification */}

            {otpOpen && (
                <div
                    role="region"
                    aria-label={t("profilePage.info.phoneVerify.title")}
                    className="border-t border-[#3A3A3A]/6 dark:border-white/6 bg-[#FAFAFA] dark:bg-[#17171b] px-5 py-5 sm:px-6"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-[#F47822]" />

                                <p className="text-sm font-bold text-[#3A3A3A] dark:text-white">
                                    {t(
                                        "profilePage.info.phoneVerify.title",
                                    )}
                                </p>
                            </div>

                            {otpNotice && (
                                <p className="mt-1.5 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">
                                    {otpNotice}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            aria-label={t(
                                "profilePage.info.phoneVerify.cancel",
                            )}
                            onClick={closeOtp}
                            className="shrink-0 rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-[#3A3A3A]/5 dark:text-white/45 dark:hover:bg-white/5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <input
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={otpCode}
                            onChange={(event) =>
                                setOtpCode(
                                    event.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6),
                                )
                            }
                            aria-label={t(
                                "profilePage.info.phoneVerify.enterCode",
                            )}
                            placeholder={t(
                                "profilePage.info.phoneVerify.enterCode",
                            )}
                            className="
                                h-12
                                w-44
                                rounded-xl
                                border
                                border-[#3A3A3A]/12 dark:border-white/12
                                bg-white dark:bg-[#232329]
                                px-4
                                text-center
                                text-base
                                font-bold
                                tracking-[0.4em]
                                text-[#3A3A3A] dark:text-[#ececef]
                                outline-none
                                transition
                                placeholder:font-medium placeholder:tracking-normal placeholder:text-[#3A3A3A]/30 dark:placeholder:text-white/30
                                focus:border-[#F47822]/50
                                focus:ring-4
                                focus:ring-[#F47822]/5
                            "
                        />

                        <button
                            type="button"
                            onClick={() => void submitPhoneCode()}
                            disabled={otpBusy || otpCode.length !== 6}
                            className="
                                inline-flex
                                h-12
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-[#F47822]
                                px-5
                                text-xs
                                font-bold
                                text-white
                                transition
                                hover:bg-[#E96D18]
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            {otpBusy ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : null}

                            {otpBusy
                                ? t("profilePage.info.phoneVerify.verifying")
                                : t("profilePage.info.phoneVerify.confirm")}
                        </button>

                        <button
                            type="button"
                            onClick={() => void startPhoneVerification()}
                            disabled={otpBusy}
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-lg
                                px-2
                                py-1.5
                                text-xs
                                font-semibold
                                text-[#F47822]
                                transition
                                hover:bg-[#F47822]/10
                                disabled:opacity-50
                            "
                        >
                            <Send className="h-3.5 w-3.5" />

                            {otpBusy
                                ? t("profilePage.info.phoneVerify.sending")
                                : t("profilePage.info.phoneVerify.resend")}
                        </button>
                    </div>

                    {otpError && (
                        <p
                            role="alert"
                            className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600"
                        >
                            {otpError}
                        </p>
                    )}
                </div>
            )}

            {/* Bio */}

            <div className="border-t border-[#3A3A3A]/6 dark:border-white/6 px-5 py-6 sm:px-6">
                <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-[#3A3A3A]/35 dark:text-white/35" />

                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/45 dark:text-white/45">
                        {t("profilePage.info.about")}
                    </p>
                </div>

                {isEditing ? (
                    <textarea
                        value={form.bio}
                        onChange={(event) =>
                            onFieldChange(
                                "bio",
                                event.target.value,
                            )
                        }
                        rows={5}
                        placeholder={t("profilePage.info.bioPh")}
                        className="
                            mt-2
                            w-full
                            resize-none
                            rounded-xl
                            border
                            border-[#3A3A3A]/8 dark:border-white/8
                            bg-[#FAFAFA] dark:bg-[#232329]
                            px-4
                            py-3
                            text-sm
                            leading-6
                            text-[#3A3A3A] dark:text-[#ececef]
                            outline-none
                            transition
                            placeholder:text-[#3A3A3A]/25 dark:placeholder:text-white/25
                            focus:border-[#F47822]/40
                            focus:bg-white dark:focus:bg-[#1b1b20]
                            focus:ring-4
                            focus:ring-[#F47822]/5
                        "
                    />
                ) : (
                    <div className="mt-2 rounded-xl border border-[#3A3A3A]/6 dark:border-white/6 bg-[#FAFAFA] dark:bg-[#232329] px-4 py-3">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[#3A3A3A]/65 dark:text-white/65">
                            {user.bio ||
                                t("profilePage.info.noBio")}
                        </p>
                    </div>
                )}
            </div>

            {/* Edit actions */}

            {isEditing && (
                <div className="flex flex-col gap-3 border-t border-[#3A3A3A]/6 dark:border-white/6 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="
                            inline-flex
                            h-10
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-[#3A3A3A]/10 dark:border-white/10
                            px-4
                            text-xs
                            font-semibold
                            text-[#3A3A3A]/60 dark:text-white/60
                            transition
                            hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <X className="h-3.5 w-3.5" />

                        {t("profilePage.info.discard")}
                    </button>

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        className="
                            inline-flex
                            h-10
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-[#F47822]
                            px-5
                            text-xs
                            font-semibold
                            text-white
                            shadow-[0_6px_18px_rgba(244,120,34,0.18)]
                            transition
                            hover:bg-[#E96D18]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        {isSaving ? (
                            <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                {t("profilePage.info.saving")}
                            </>
                        ) : (
                            <>
                                <Save className="h-3.5 w-3.5" />

                                {t("profilePage.info.save")}
                            </>
                        )}
                    </button>
                </div>
            )}
        </section>
    );
}