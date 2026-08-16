import {
    Camera,
    Check,
    Mail,
    MapPin,
    Phone,
    UserRound,
} from "lucide-react";

import {
    useState,
} from "react";

import {
    useAuth,
} from "@/features/auth/hooks/useAuth";

export function SettingsPage() {
    const { user } = useAuth();

    const [firstName, setFirstName] =
        useState(user?.first_name ?? "");

    const [lastName, setLastName] =
        useState(user?.last_name ?? "");

    const [username, setUsername] =
        useState(user?.username ?? "");

    const [email, setEmail] =
        useState(user?.email ?? "");

    const [phone, setPhone] =
        useState(user?.phone ?? "");

    const [country, setCountry] =
        useState(user?.country ?? "");

    const [bio, setBio] =
        useState(user?.bio ?? "");

    const [isSaving, setIsSaving] =
        useState(false);

    const [saved, setSaved] =
        useState(false);

    const handleSubmit = async (
        event: React.FormEvent,
    ) => {
        event.preventDefault();

        setIsSaving(true);
        setSaved(false);

        /*
         * API update will be connected here.
         *
         * Example:
         *
         * await updateProfile({
         *     first_name: firstName,
         *     last_name: lastName,
         *     username,
         *     phone,
         *     country,
         *     bio,
         * });
         */

        await new Promise((resolve) =>
            setTimeout(resolve, 700),
        );

        setIsSaving(false);
        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 2500);
    };

    const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`
        .toUpperCase();

    return (
        <main className="min-h-full bg-[#F3F3F3]">
            <div className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-8 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                        Account
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#3A3A3A]">
                        Settings
                    </h1>

                    <p className="mt-1 text-sm text-[#3A3A3A]/50">
                        Manage your profile and account
                        information.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
                    {/* Settings navigation */}
                    <aside className="h-fit rounded-2xl border border-[#3A3A3A]/8 bg-white p-2 shadow-[0_8px_30px_rgba(58,58,58,0.04)]">
                        <div className="px-3 py-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/30">
                                Settings
                            </p>
                        </div>

                        <div className="space-y-1">
                            <SettingsItem
                                label="Profile"
                                active
                                icon={UserRound}
                            />

                            <SettingsItem
                                label="Security"
                                icon={Check}
                            />

                            <SettingsItem
                                label="Notifications"
                                icon={Mail}
                            />

                            <SettingsItem
                                label="Learning preferences"
                                icon={UserRound}
                            />

                            <SettingsItem
                                label="Appearance"
                                icon={UserRound}
                            />

                            <SettingsItem
                                label="Privacy"
                                icon={UserRound}
                            />

                            <SettingsItem
                                label="Subscription"
                                icon={UserRound}
                            />
                        </div>
                    </aside>

                    {/* Profile */}
                    <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.04)]">
                        {/* Profile heading */}
                        <div className="border-b border-[#3A3A3A]/6 px-5 py-5 sm:px-7">
                            <h2 className="text-base font-semibold text-[#3A3A3A]">
                                Profile
                            </h2>

                            <p className="mt-1 text-xs text-[#3A3A3A]/45">
                                Keep your personal information
                                up to date.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-5 sm:p-7"
                        >
                            {/* Avatar */}
                            <div className="flex flex-col gap-4 border-b border-[#3A3A3A]/6 pb-6 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#F47822]/10 text-xl font-bold text-[#F47822]">
                                        {user?.avatar ? (
                                            <img
                                                src={
                                                    user.avatar
                                                }
                                                alt={`${firstName} ${lastName}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            initials
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-[#3A3A3A] text-white shadow-sm transition hover:bg-[#F47822]"
                                        title="Change profile picture"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-[#3A3A3A]">
                                        Profile picture
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45">
                                        Add a professional photo
                                        so your instructors can
                                        recognize you.
                                    </p>

                                    <button
                                        type="button"
                                        className="mt-2 text-xs font-semibold text-[#F47822] hover:underline"
                                    >
                                        Upload new picture
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="mt-6">
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-[#3A3A3A]">
                                        Personal information
                                    </p>

                                    <p className="mt-1 text-[11px] text-[#3A3A3A]/40">
                                        This information is used
                                        across your HBT learning
                                        experience.
                                    </p>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FormField
                                        label="First name"
                                        value={firstName}
                                        onChange={setFirstName}
                                        placeholder="Enter your first name"
                                    />

                                    <FormField
                                        label="Last name"
                                        value={lastName}
                                        onChange={setLastName}
                                        placeholder="Enter your last name"
                                    />

                                    <FormField
                                        label="Username"
                                        value={username}
                                        onChange={setUsername}
                                        placeholder="Enter your username"
                                    />

                                    <FormField
                                        label="Email address"
                                        value={email}
                                        onChange={setEmail}
                                        placeholder="Enter your email"
                                        type="email"
                                        disabled
                                        icon={Mail}
                                    />

                                    <FormField
                                        label="Phone number"
                                        value={phone}
                                        onChange={setPhone}
                                        placeholder="Enter your phone number"
                                        icon={Phone}
                                    />

                                    <FormField
                                        label="Country"
                                        value={country}
                                        onChange={setCountry}
                                        placeholder="Enter your country"
                                        icon={MapPin}
                                    />
                                </div>

                                {/* Bio */}
                                <div className="mt-5">
                                    <label
                                        htmlFor="bio"
                                        className="mb-2 block text-xs font-semibold text-[#3A3A3A]"
                                    >
                                        Bio
                                    </label>

                                    <textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(event) =>
                                            setBio(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        rows={4}
                                        maxLength={500}
                                        placeholder="Tell us a little about yourself..."
                                        className="w-full resize-none rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 py-3 text-sm text-[#3A3A3A] outline-none transition placeholder:text-[#3A3A3A]/25 focus:border-[#F47822]/50 focus:bg-white focus:ring-4 focus:ring-[#F47822]/5"
                                    />

                                    <p className="mt-1.5 text-right text-[10px] text-[#3A3A3A]/35">
                                        {bio.length}/500
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#3A3A3A]/6 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-[11px] text-[#3A3A3A]/40">
                                    Your email address cannot be
                                    changed here.
                                </p>

                                <div className="flex items-center gap-3">
                                    {saved && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                            <Check className="h-3.5 w-3.5" />
                                            Changes saved
                                        </span>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F47822] px-5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(244,120,34,0.18)] transition hover:bg-[#E96D18] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSaving
                                            ? "Saving..."
                                            : "Save changes"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    );
}

interface SettingsItemProps {
    label: string;
    icon: typeof UserRound;
    active?: boolean;
}

function SettingsItem({
    label,
    icon: Icon,
    active = false,
}: SettingsItemProps) {
    return (
        <button
            type="button"
            className={`
                flex
                h-10
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                text-left
                text-xs
                font-medium
                transition
                ${
                    active
                        ? "bg-[#F47822]/10 text-[#F47822]"
                        : "text-[#3A3A3A]/50 hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A]"
                }
            `}
        >
            <Icon className="h-4 w-4 shrink-0" />

            <span>{label}</span>
        </button>
    );
}

interface FormFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    disabled?: boolean;
    icon?: typeof Mail;
}

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    disabled = false,
    icon: Icon,
}: FormFieldProps) {
    return (
        <div>
            <label className="mb-2 block text-xs font-semibold text-[#3A3A3A]">
                {label}
            </label>

            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3A3A3A]/25" />
                )}

                <input
                    type={type}
                    value={value}
                    disabled={disabled}
                    onChange={(event) =>
                        onChange(
                            event.target.value,
                        )
                    }
                    placeholder={placeholder}
                    className={`
                        h-10
                        w-full
                        rounded-xl
                        border
                        border-[#3A3A3A]/10
                        bg-[#FAFAFA]
                        px-3.5
                        text-sm
                        text-[#3A3A3A]
                        outline-none
                        transition
                        placeholder:text-[#3A3A3A]/25
                        focus:border-[#F47822]/50
                        focus:bg-white
                        focus:ring-4
                        focus:ring-[#F47822]/5
                        ${
                            Icon
                                ? "pl-9"
                                : ""
                        }
                        ${
                            disabled
                                ? "cursor-not-allowed bg-[#F3F3F3] text-[#3A3A3A]/40"
                                : ""
                        }
                    `}
                />
            </div>
        </div>
    );
}