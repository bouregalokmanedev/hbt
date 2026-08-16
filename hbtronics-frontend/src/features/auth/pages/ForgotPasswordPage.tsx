import {
    useState,
} from "react";

import {
    Link,
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
    useAuthLanguage,
} from "../i18n/auth-language";

import {
    authApi,
} from "../api/auth.api";

interface ForgotPasswordForm {
    email: string;
}

export function ForgotPasswordPage() {
    const { t } =
        useAuthLanguage();

    const [sent, setSent] =
        useState(false);

    const {
        register,
        handleSubmit,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<ForgotPasswordForm>({
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (
        values: ForgotPasswordForm,
    ) => {
        await authApi.forgotPassword({
            email: values.email,
        });

        setSent(true);
    };

    return (
        <AuthShell>
            <div className="flex max-h-full flex-col justify-center overflow-hidden">
                {!sent ? (
                    <>
                        <AuthHeader
                            eyebrow={
                                t.forgot
                                    .eyebrow
                            }
                            title={
                                t.forgot
                                    .title
                            }
                            description={
                                t.forgot
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
                                id="forgot-email"
                                label={
                                    t.common
                                        .email
                                }
                                type="email"
                                autoComplete="email"
                                placeholder="name@example.com"
                                {...register(
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
                                    errors
                                        .email
                                        ?.message
                                }
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
                                    : t.forgot
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
                    </>
                ) : (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822]/10 text-xl text-[#F47822]">
                            ✓
                        </div>

                        <AuthHeader
                            eyebrow={
                                t.forgot
                                    .eyebrow
                            }
                            title={
                                t.forgot
                                    .successTitle
                            }
                            description={
                                t.forgot
                                    .successDescription
                            }
                        />

                        <Link
                            to="/login"
                            className="flex h-12 items-center justify-center rounded-xl bg-[#F47822] text-sm font-semibold text-white transition hover:bg-[#e96d18]"
                        >
                            {
                                t.common
                                    .backToLogin
                            }
                        </Link>
                    </>
                )}
            </div>
        </AuthShell>
    );
}