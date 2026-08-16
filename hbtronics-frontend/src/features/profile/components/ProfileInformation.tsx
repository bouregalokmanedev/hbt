
import {
    Clock3,
    Edit3,
    Globe2,
    Languages,
    Mail,
    MapPin,
    Phone,
    Save,
    UserRound,
    X,
} from "lucide-react";

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

const LANGUAGES = [
    {
        value: "en",
        label: "English",
    },
    {
        value: "fr",
        label: "French",
    },
    {
        value: "ar",
        label: "Arabic",
    },
    {
        value: "es",
        label: "Spanish",
    },
    {
        value: "de",
        label: "German",
    },
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
    border-[#3A3A3A]/8
    bg-[#FAFAFA]
    px-4
    text-sm
    text-[#3A3A3A]
    outline-none
    transition
    placeholder:text-[#3A3A3A]/25
    focus:border-[#F47822]/40
    focus:bg-white
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
    border-[#3A3A3A]/6
    bg-[#FAFAFA]
    px-4
    text-sm
    text-[#3A3A3A]/70
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
                <Icon className="h-4 w-4 text-[#3A3A3A]/35" />

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/45">
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
    return (
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-[#3A3A3A]/6 px-5 py-4 sm:px-6">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        Personal details
                    </p>

                    <h2 className="mt-1 text-base font-semibold text-[#3A3A3A]">
                        Profile information
                    </h2>
                </div>

                {!isEditing && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#3A3A3A]/8 px-3 text-xs font-semibold text-[#3A3A3A]/65 transition hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822]"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                    </button>
                )}
            </div>

            {/* Fields */}

            <div className="grid gap-x-6 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-6">
                {/* First name */}

                <Field icon={UserRound} label="First name">
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

                <Field icon={UserRound} label="Last name">
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

                <Field icon={UserRound} label="Username">
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

                <Field icon={Mail} label="Email">
                    <div className="relative">
                        <div className={readOnlyClassName}>
                            {user.email || "—"}
                        </div>

                        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-[#3A3A3A]/5 px-2 py-1 text-[9px] font-semibold text-[#3A3A3A]/40">
                            Verified
                        </span>
                    </div>
                </Field>

                {/* Phone */}

                <Field icon={Phone} label="Phone">
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
                                    border-[#3A3A3A]/8
                                    bg-[#FAFAFA]
                                    px-3
                                    text-sm
                                    font-medium
                                    text-[#3A3A3A]
                                    outline-none
                                    transition
                                    focus:border-[#F47822]/40
                                    focus:bg-white
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
                                placeholder="Phone number"
                                className="
                                    h-12
                                    min-w-0
                                    flex-1
                                    rounded-xl
                                    border
                                    border-[#3A3A3A]/8
                                    bg-[#FAFAFA]
                                    px-4
                                    text-sm
                                    text-[#3A3A3A]
                                    outline-none
                                    transition
                                    placeholder:text-[#3A3A3A]/25
                                    focus:border-[#F47822]/40
                                    focus:bg-white
                                    focus:ring-4
                                    focus:ring-[#F47822]/5
                                "
                            />
                        </div>
                    ) : (
                        <div className={readOnlyClassName}>
                            {user.phone || "—"}
                        </div>
                    )}
                </Field>

                {/* Country */}

                <Field icon={MapPin} label="Country">
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
                                Select country
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

                <Field icon={Languages} label="Language">
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
                                    {language.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className={readOnlyClassName}>
                            {LANGUAGES.find(
                                (language) =>
                                    language.value ===
                                    user.language,
                            )?.label ??
                                user.language ??
                                "—"}
                        </div>
                    )}
                </Field>

                {/* Timezone */}

                <Field icon={Clock3} label="Timezone">
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

            {/* Bio */}

            <div className="border-t border-[#3A3A3A]/6 px-5 py-6 sm:px-6">
                <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-[#3A3A3A]/35" />

                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/45">
                        About
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
                        placeholder="Tell other learners a little about yourself..."
                        className="
                            mt-2
                            w-full
                            resize-none
                            rounded-xl
                            border
                            border-[#3A3A3A]/8
                            bg-[#FAFAFA]
                            px-4
                            py-3
                            text-sm
                            leading-6
                            text-[#3A3A3A]
                            outline-none
                            transition
                            placeholder:text-[#3A3A3A]/25
                            focus:border-[#F47822]/40
                            focus:bg-white
                            focus:ring-4
                            focus:ring-[#F47822]/5
                        "
                    />
                ) : (
                    <div className="mt-2 rounded-xl border border-[#3A3A3A]/6 bg-[#FAFAFA] px-4 py-3">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[#3A3A3A]/65">
                            {user.bio ||
                                "No bio added yet."}
                        </p>
                    </div>
                )}
            </div>

            {/* Edit actions */}

            {isEditing && (
                <div className="flex flex-col gap-3 border-t border-[#3A3A3A]/6 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
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
                            border-[#3A3A3A]/10
                            px-4
                            text-xs
                            font-semibold
                            text-[#3A3A3A]/60
                            transition
                            hover:bg-[#3A3A3A]/5
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <X className="h-3.5 w-3.5" />

                        Discard changes
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

                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-3.5 w-3.5" />

                                Save changes
                            </>
                        )}
                    </button>
                </div>
            )}
        </section>
    );
}