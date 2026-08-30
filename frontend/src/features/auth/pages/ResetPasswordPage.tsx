import {
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import {
    useForm,
} from "react-hook-form";

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
    useAuthLanguage,
} from "../i18n/auth-language";

import {
    authApi,
} from "../api/auth.api";

interface ResetPasswordForm {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}

export function ResetPasswordPage() {
    const navigate =
        useNavigate();

    const [
        searchParams,
    ] = useSearchParams();

    const { t } =
        useAuthLanguage();

    const [success, setSuccess] =
        useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<ResetPasswordForm>({
        defaultValues: {
            email:
                searchParams.get(
                    "email",
                ) ?? "",

            token:
                searchParams.get(
                    "token",
                ) ?? "",

            password: "",
            password_confirmation:
                "",
        },
    });

    const password = watch("password");
    const resetEmail = searchParams.get("email") ?? "";

    const onSubmit = async (
        values: ResetPasswordForm,
    ) => {
        await authApi.resetPassword(
            values,
        );

        setSuccess(true);
    };

    if (success) {
        return (
            <AuthShell>
                <div className="flex flex-col justify-center text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822]/10 text-xl text-[#F47822]">
                        ✓
                    </div>

                    <AuthHeader
                        eyebrow={
                            t.reset
                                .eyebrow
                        }
                        title={
                            t.reset
                                .successTitle
                        }
                        description={
                            t.reset
                                .successDescription
                        }
                    />

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/login",
                            )
                        }
                        className="h-12 rounded-xl bg-[#F47822] text-sm font-semibold text-white transition hover:bg-[#e96d18]"
                    >
                        {t.common.signIn}
                    </button>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <div className="flex max-h-full flex-col justify-center overflow-hidden">
                <AuthHeader
                    eyebrow={
                        t.reset
                            .eyebrow
                    }
                    title={
                        t.reset.title
                    }
                    description={
                        t.reset
                            .description
                    }
                />

                <form
                    onSubmit={handleSubmit(
                        onSubmit,
                    )}
                    className="space-y-4"
                    noValidate
                >
                    <AuthInput
                        id="reset-email"
                        label={
                            t.common.email
                        }
                        type="email"
                        autoComplete="email"
                        value={resetEmail}
                        disabled
                        placeholder="name@example.com"
                        error={
                            errors.email
                                ?.message
                        }
                    />
                    <input type="hidden" {...register("email", { required: t.common.required })} />

                    <PasswordField
                        id="reset-password"
                        label={
                            t.common.password
                        }
                        autoComplete="new-password"
                        placeholder="••••••••"
                        showLabel={
                            t.common
                                .showPassword
                        }
                        hideLabel={
                            t.common
                                .hidePassword
                        }
                        {...register(
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
                                    "Use 8+ characters with an uppercase letter, number, and symbol.",
                            },
                        )}
                        error={
                            errors.password
                                ?.message
                        }
                    />
                    <PasswordRequirements password={password} />

                    <PasswordField
                        id="reset-password-confirmation"
                        label={
                            t.common
                                .confirmPassword
                        }
                        autoComplete="new-password"
                        placeholder={t.common.confirmPasswordPlaceholder}
                        showLabel={t.common.showPassword}
                        hideLabel={t.common.hidePassword}
                        {...register(
                            "password_confirmation",
                            {
                                required:
                                    t.common
                                        .required,

                                validate:
                                    (
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
                                .password_confirmation
                                ?.message
                        }
                    />

                    <input
                        type="hidden"
                        {...register(
                            "token",
                        )}
                    />

                    <button
                        type="submit"
                        disabled={
                            isSubmitting
                        }
                        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#F47822] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition-all hover:bg-[#e96d18] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting
                            ? t.common
                                  .loading
                            : t.reset
                                  .submit}
                    </button>
                </form>

                <Link
                    to="/login"
                    className="mt-5 text-center text-sm font-medium text-[#3A3A3A]/60 transition hover:text-[#F47822]"
                >
                    ←{" "}
                    {
                        t.common
                            .backToLogin
                    }
                </Link>
            </div>
        </AuthShell>
    );
}
