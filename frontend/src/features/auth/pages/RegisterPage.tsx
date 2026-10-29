import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import {
    useForm,
} from "react-hook-form";

import { useState } from "react";

import {
    AuthShell,
} from "../components/AuthShell";

import {
    AuthHeader,
} from "../components/AuthHeader";

import {
    AuthInput,
} from "../components/AuthInput";

import {
    PasswordField,
} from "../components/PasswordField";
import { isStrongPassword, PasswordRequirements } from "../components/PasswordRequirements";

import {
    GoogleIcon,
} from "../components/GoogleIcon";

import {
    useAuthLanguage,
} from "../i18n/auth-language";

import {
    useAuth,
} from "../hooks/useAuth";
import {
    visitorId,
} from "@/features/marketing/tracking";
import {
    dashboardRouteFor,
} from "../utils/dashboard-route";
import {
    useAuthStore,
} from "../store/auth.store";
import {
    applyServerFieldErrors,
    hasNameNumber,
    isValidName,
    localAuthErrorMessage,
} from "../utils/auth-errors";
import { HoneypotField } from "@/features/security/HoneypotField";
import { TurnstileWidget } from "@/features/security/TurnstileWidget";
import { BOT_HONEYPOT_FIELD } from "@/features/security/botProtection";


interface RegisterForm {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    website: string;
}

function safeNextPath(value: string | null): string | null {
    return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}


export function RegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const next = safeNextPath(searchParams.get("next"));
    // Carried by the shared invite link so the inviter gets credited on signup.
    const ref = searchParams.get("ref")?.trim() ?? "";

    const {
        t,
    } = useAuthLanguage();

    const {
        register: registerField,
        handleSubmit,
        watch,
        setError,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<RegisterForm>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            passwordConfirmation: "",
            website: "",
        },
        mode: "onChange",
    });

    const {
        register: registerUser,
        error,
        errorCode,
    } = useAuth();

    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const password = watch("password");

    const bannerMessage = error
        ? localAuthErrorMessage(errorCode, t, error)
        : "";

    const applyNameRules = (value: string): true | string => {
        const trimmed = value.trim();
        if (!trimmed) {
            return t.common.required;
        }
        if (hasNameNumber(trimmed)) {
            return t.common.nameLettersOnly;
        }
        if (!isValidName(trimmed)) {
            return t.common.nameInvalid;
        }
        return true;
    };

    const onSubmit = async (
        values: RegisterForm,
    ) => {
        try {
            await registerUser({
                first_name: values.firstName.trim(),
                last_name: values.lastName.trim(),
                email: values.email.trim(),
                password: values.password,
                password_confirmation:
                    values.passwordConfirmation,
                ...(ref ? { ref } : {}),
                visitor_id: visitorId(),
                [BOT_HONEYPOT_FIELD]: values.website,
                ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
            });

            sessionStorage.removeItem("hbt:auth-return-to");
            if (next) {
                navigate(next, { replace: true });
            } else {
                navigate(dashboardRouteFor(useAuthStore.getState().user), { replace: true });
            }
        } catch {
            // The store updates synchronously before rethrowing, so the
            // latest field-level 422 errors are available here.
            applyServerFieldErrors(
                useAuthStore.getState().fieldErrors,
                t,
                setError,
                ["firstName", "lastName", "email", "password", "passwordConfirmation"],
            );
        }
    };


    const handleGoogleAuth = () => {
        const apiUrl =
            import.meta.env.VITE_API_URL;

        if (!apiUrl) {
            return;
        }

        window.location.href =
            `${apiUrl}/v1/auth/google/redirect`;
    };


    return (
        <AuthShell>
            <div className="flex w-full flex-col">
                <AuthHeader
                    eyebrow={
                        t.register.eyebrow
                    }
                    title={
                        t.register.title
                    }
                    description={
                        t.register.description
                    }
                />

                <form
                    onSubmit={handleSubmit(
                        onSubmit,
                    )}
                    className="space-y-4"
                    noValidate
                >
                    {/* First name + Last name */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <AuthInput
                            id="register-first-name"
                            label={
                                t.common.firstName
                            }
                            type="text"
                            autoComplete="given-name"
                            placeholder={
                                t.common
                                    .firstNamePlaceholder
                            }
                            {...registerField(
                                "firstName",
                                {
                                    validate: applyNameRules,
                                },
                            )}
                            error={
                                errors.firstName
                                    ?.message
                            }
                        />

                        <AuthInput
                            id="register-last-name"
                            label={
                                t.common.lastName
                            }
                            type="text"
                            autoComplete="family-name"
                            placeholder={
                                t.common
                                    .lastNamePlaceholder
                            }
                            {...registerField(
                                "lastName",
                                {
                                    validate: applyNameRules,
                                },
                            )}
                            error={
                                errors.lastName
                                    ?.message
                            }
                        />
                    </div>


                    {/* Email */}
                    <AuthInput
                        id="register-email"
                        label={
                            t.common.email
                        }
                        type="email"
                        autoComplete="email"
                        placeholder={
                            t.common
                                .emailPlaceholder
                        }
                        {...registerField(
                            "email",
                            {
                                required:
                                    t.common
                                        .required,
                                pattern: {
                                    value: /^\S+@\S+\.\S+$/,
                                    message:
                                        t.common
                                            .invalidEmail,
                                },
                            },
                        )}
                        error={
                            errors.email
                                ?.message
                        }
                    />


                    {/* Password */}
                    <PasswordField
                        id="register-password"
                        label={
                            t.common.password
                        }
                        autoComplete="new-password"
                        placeholder={
                            t.common
                                .passwordPlaceholder
                        }
                        showLabel={
                            t.common.showPassword
                        }
                        hideLabel={
                            t.common.hidePassword
                        }
                        {...registerField(
                            "password",
                            {
                                required:
                                    t.common
                                        .required,
                                minLength: {
                                    value: 8,
                                    message:
                                        t.common
                                            .passwordMinLength,
                                },
                                validate: (value) =>
                                    isStrongPassword(value) ||
                                    t.common.passwordStrength,
                            },
                        )}
                        error={
                            errors.password
                                ?.message
                        }
                    />
                    <PasswordRequirements password={password} />


                    {/* Password confirmation */}
                    <PasswordField
                        id="register-password-confirmation"
                        label={
                            t.common
                                .confirmPassword
                        }
                        autoComplete="new-password"
                        placeholder={
                            t.common
                                .confirmPasswordPlaceholder
                        }
                        showLabel={
                            t.common.showPassword
                        }
                        hideLabel={
                            t.common.hidePassword
                        }
                        {...registerField(
                            "passwordConfirmation",
                            {
                                required:
                                    t.common
                                        .required,

                                validate: (
                                    value,
                                ) =>
                                    value ===
                                        password ||
                                    t.common
                                        .passwordsDoNotMatch,
                            },
                        )}
                        error={
                            errors
                                .passwordConfirmation
                                ?.message
                        }
                    />


                    {/* Backend error */}
                    {bannerMessage && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                        >
                            {bannerMessage}
                        </div>
                    )}

                    <HoneypotField {...registerField("website")} />
                    <TurnstileWidget onToken={setTurnstileToken} />


                    {/* Terms */}
                    <p className="pt-1 text-center text-[11px] leading-5 text-[#3A3A3A]/50 dark:text-white/50">
                        {t.register.terms}
                    </p>


                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={
                            isSubmitting
                        }
                        className="
                            flex
                            h-12
                            w-full
                            items-center
                            justify-center
                            rounded-xl
                            bg-[#F47822]
                            px-5
                            text-sm
                            font-semibold
                            text-white
                            shadow-[0_8px_20px_rgba(244,120,34,0.22)]
                            transition-all
                            hover:bg-[#e96d18]
                            hover:shadow-[0_10px_25px_rgba(244,120,34,0.28)]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        {isSubmitting
                            ? t.common.loading
                            : t.register.submit}
                    </button>
                </form>


                {/* Secure authentication */}
                <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#3A3A3A]/50 dark:text-white/50">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <path
                            d="M12 3L19 6V11C19 15.5 16.1 19.3 12 21C7.9 19.3 5 15.5 5 11V6L12 3Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        <path
                            d="M9.5 12L11.2 13.7L14.8 10.1"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    <span>
                        {
                            t.register
                                .secureAuthentication
                        }
                    </span>
                </div>


                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />

                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#3A3A3A]/35 dark:text-white/35">
                        {t.common.or}
                    </span>

                    <div className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
                </div>


                {/* Google */}
                <button
                    type="button"
                    onClick={
                        handleGoogleAuth
                    }
                    className="
                        flex
                        h-11
                        w-full
                        items-center
                        justify-center
                        gap-3
                        rounded-xl
                        border
                        border-[#3A3A3A]/10 dark:border-white/10
                        bg-white dark:bg-[#1b1b20]
                        text-sm
                        font-medium
                        text-[#3A3A3A]
                        transition
                        hover:bg-[#F3F3F3] dark:bg-[#101013]
                        focus:outline-none
                        focus:ring-4
                        focus:ring-[#F47822]/10
                    "
                >
                    <GoogleIcon />

                    <span>
                        {
                            t.common
                                .continueWithGoogle
                        }
                    </span>
                </button>


                {/* Login */}
                <div className="mt-5 pb-2 text-center text-sm text-[#3A3A3A]/60 dark:text-white/60">
                    {
                        t.common
                            .alreadyAccount
                    }{" "}

                    <Link
                        to="/login"
                        className="font-semibold text-[#F47822] hover:underline"
                    >
                        {
                            t.common
                                .signIn
                        }
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}
