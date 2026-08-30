import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { useState } from "react";

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
import {
    dashboardRouteFor,
} from "../utils/dashboard-route";
import {
    useAuthStore,
} from "../store/auth.store";

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

export function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const next = safeNext(searchParams.get("next"));

    const continueAfterAuthentication = (user: { roles: string[] }) => {
        sessionStorage.removeItem("hbt:auth-return-to");
        navigate(dashboardRouteFor(user), { replace: true });
    };

    const { t } =
        useAuthLanguage();

    const {
        login,
        verifyTwoFactorLogin,
        error,
        isLoading,
        clearError,
    } = useAuth();
    const [mfaEmail, setMfaEmail] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState("");

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
            const authenticatedUser = useAuthStore.getState().user;
            continueAfterAuthentication(authenticatedUser ?? { roles: [] });
        } catch (caught) {
            /*
             * The auth store already stores
             * the error.
             *
             * We intentionally don't navigate
             * when authentication fails.
             */
            if (caught instanceof Error && caught.message.toLowerCase().includes("two-factor verification")) setMfaEmail(values.email);
        }
    };

    const submitMfa = async (event: React.FormEvent) => { event.preventDefault(); if (!mfaEmail) return; try { await verifyTwoFactorLogin(mfaEmail, mfaCode); continueAfterAuthentication(useAuthStore.getState().user ?? { roles: [] }); } catch {} };

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

                {mfaEmail ? <form onSubmit={submitMfa} className="space-y-4"><div className="rounded-2xl border border-[#F47822]/20 bg-[#F47822]/5 p-4"><p className="text-sm font-bold text-[#3A3A3A]">Verify your sign-in</p><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60">Enter the six-digit security code sent to {mfaEmail}.</p></div><AuthInput id="login-mfa-code" label="Verification code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /><button type="submit" disabled={isLoading || mfaCode.length !== 6} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#F47822] px-5 text-sm font-semibold text-white disabled:opacity-60">{isLoading ? t.common.loading : "Verify and sign in"}</button><button type="button" onClick={() => { setMfaEmail(null); setMfaCode(""); clearError(); }} className="w-full text-xs font-semibold text-[#3A3A3A]/55 hover:text-[#F47822]">Use a different account</button>{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}</form> : <form
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
                        to={`/forgot-password${next ? `?next=${encodeURIComponent(next)}` : ""}`}
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
                </form>}

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
                        to={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
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

function safeNext(value: string | null): string | null {
    return value && value.startsWith("/") && !value.startsWith("//")
        ? value
        : null;
}
