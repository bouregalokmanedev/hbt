import {
    Link,
    useNavigate,
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

import {
    GoogleIcon,
} from "../components/GoogleIcon";

import {
    useAuthLanguage,
} from "../i18n/auth-language";

import {
    useAuth,
} from "../hooks/useAuth";

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

export function LoginPage() {
    const navigate = useNavigate();

    const { t } =
        useAuthLanguage();

    const {
        login,
        error,
        isLoading,
        clearError,
    } = useAuth();

    const {
        register,
        handleSubmit,
        formState: {
            errors,
        },
    } = useForm<LoginForm>({
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    });

    const onSubmit = async (
        values: LoginForm,
    ) => {
        clearError();

        try {
            await login({
                email: values.email,
                password: values.password,
            });

            /*
             * login() updates the Zustand store:
             *
             * user
             * isAuthenticated
             * isInitialized
             *
             * AuthGuard can therefore immediately
             * allow access to /dashboard.
             */
            navigate(
                "/dashboard",
                {
                    replace: true,
                },
            );
        } catch {
            /*
             * The auth store already stores
             * the error.
             *
             * We intentionally don't navigate
             * when authentication fails.
             */
        }
    };

    const handleGoogleAuth = () => {
        const apiUrl =
            import.meta.env
                .VITE_API_URL;

        if (!apiUrl) {
            return;
        }

        window.location.href =
            `${apiUrl}/v1/auth/google/redirect`;
    };

    return (
        <AuthShell>
            <div className="flex w-full flex-col justify-center">
                <AuthHeader
                    eyebrow={
                        t.login.eyebrow
                    }
                    title={
                        t.login.title
                    }
                    description={
                        t.login.description
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
                        id="login-email"
                        label={
                            t.common.email
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
                            },
                        )}
                        error={
                            errors.email
                                ?.message
                        }
                    />

                    <PasswordField
                        id="login-password"
                        label={
                            t.common.password
                        }
                        autoComplete="current-password"
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
                            },
                        )}
                        error={
                            errors.password
                                ?.message
                        }
                    />

                    <div className="flex items-center justify-between gap-4">
                        <label className="flex items-center gap-2 text-xs text-[#3A3A3A]/60">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-[#3A3A3A]/20 accent-[#F47822]"
                                {...register(
                                    "remember",
                                )}
                            />

                            <span>
                                {
                                    t.common
                                        .rememberMe
                                }
                            </span>
                        </label>

                        <Link
                            to="/forgot-password"
                            className="text-xs font-medium text-[#F47822] hover:underline"
                        >
                            {
                                t.common
                                    .forgotPassword
                            }
                        </Link>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={
                            isLoading
                        }
                        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#F47822] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition-all hover:bg-[#e96d18] hover:shadow-[0_10px_25px_rgba(244,120,34,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading
                            ? t.common
                                  .loading
                            : t.login.submit}
                    </button>
                </form>

                <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#3A3A3A]/10" />

                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#3A3A3A]/35">
                        OR
                    </span>

                    <div className="h-px flex-1 bg-[#3A3A3A]/10" />
                </div>

                <button
                    type="button"
                    onClick={
                        handleGoogleAuth
                    }
                    className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-white text-sm font-medium text-[#3A3A3A] transition hover:bg-[#F3F3F3] focus:outline-none focus:ring-4 focus:ring-[#F47822]/10"
                >
                    <GoogleIcon />

                    <span>
                        {
                            t.common
                                .continueWithGoogle
                        }
                    </span>
                </button>

                <div className="mt-5 text-center text-sm text-[#3A3A3A]/60">
                    {
                        t.common
                            .noAccount
                    }{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-[#F47822]"
                    >
                        {
                            t.common
                                .signUp
                        }
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}