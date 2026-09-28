import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import { useForm } from "react-hook-form";

import { AuthShell } from "../components/AuthShell";

import { AuthHeader } from "../components/AuthHeader";

import { AuthInput } from "../components/AuthInput";

import { PasswordField } from "../components/PasswordField";

import { GoogleIcon } from "../components/GoogleIcon";

import { useAuthLanguage } from "../i18n/auth-language";

import { useAuth } from "../hooks/useAuth";
import { dashboardRouteFor } from "../utils/dashboard-route";
import { useAuthStore } from "../store/auth.store";
import { authApi } from "../api/auth.api";
import {
  applyServerFieldErrors,
  localAuthErrorMessage,
} from "../utils/auth-errors";

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

function isMfaChallenge(caught: unknown): boolean {
  // Duck-type first: duplicate ApiError module instances break `instanceof`.
  if (typeof caught === "object" && caught !== null) {
    const status = "status" in caught ? (caught as { status?: unknown }).status : undefined;
    if (status === 423) return true;
    const data = "data" in caught ? (caught as { data?: unknown }).data : undefined;
    if (
      data &&
      typeof data === "object" &&
      "requires_two_factor" in data &&
      (data as { requires_two_factor?: unknown }).requires_two_factor
    ) {
      return true;
    }
    const message = "message" in caught ? (caught as { message?: unknown }).message : undefined;
    if (typeof message === "string" && message.toLowerCase().includes("two-factor")) {
      return true;
    }
  }
  return (
    caught instanceof Error &&
    caught.message.toLowerCase().includes("two-factor")
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  // Captured on mount from /login?verified=1 (email link) or ?verify=error
  // (expired link); the query is then stripped so a refresh stays quiet.
  const [verificationNote] = useState<"verified" | "invalid" | null>(() =>
    searchParams.get("verified") === "1"
      ? "verified"
      : searchParams.get("verify") === "error"
        ? "invalid"
        : null,
  );

  useEffect(() => {
    if (!searchParams.has("verified") && !searchParams.has("verify")) {
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.delete("verified");
    params.delete("verify");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const continueAfterAuthentication = (user: { roles: string[] }) => {
    sessionStorage.removeItem("hbt:auth-return-to");
    navigate(dashboardRouteFor(user), { replace: true });
  };

  const { t } = useAuthLanguage();

  const { login, verifyTwoFactorLogin, error, errorCode, fieldErrors, isLoading, clearError } =
    useAuth();
  /*
   * The challenge email lives in sessionStorage (not just component state)
   * so a hot reload or page refresh in the middle of the MFA step cannot
   * strand the user on the password form with an orphaned challenge error.
   */
  const [mfaEmail, setMfaEmailState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("hbt:mfa-email");
    } catch {
      return null;
    }
  });
  const setMfaEmail = (email: string | null) => {
    setMfaEmailState(email);
    try {
      if (email) sessionStorage.setItem("hbt:mfa-email", email);
      else sessionStorage.removeItem("hbt:mfa-email");
    } catch {
      // Storage unavailable — challenge still works for this render cycle.
    }
  };
  const [mfaCode, setMfaCode] = useState("");
  const [lastLoginEmail, setLastLoginEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resentNote, setResentNote] = useState(false);
  const [resendFailed, setResendFailed] = useState(false);
  const [verificationResending, setVerificationResending] = useState(false);
  const [verificationResent, setVerificationResent] = useState(false);
  const [verificationResendFailed, setVerificationResendFailed] = useState(false);
  const challengeEmail =
    mfaEmail ||
    (lastLoginEmail && error?.toLowerCase().includes("two-factor")
      ? lastLoginEmail
      : null);

  useEffect(() => {
    if (lastLoginEmail && error?.toLowerCase().includes("two-factor")) {
      setMfaEmail(lastLoginEmail);
      setMfaCode("");
    }
  }, [error, lastLoginEmail]);

  // Recover a challenge that hit sessionStorage after this instance mounted
  // (e.g. store error landed before the 423 catch wrote the email).
  useEffect(() => {
    if (mfaEmail || !error?.toLowerCase().includes("two-factor")) return;
    try {
      const stored = sessionStorage.getItem("hbt:mfa-email");
      if (stored) setMfaEmailState(stored);
    } catch {
      // Storage unavailable — lastLoginEmail path above still applies.
    }
  }, [error, mfaEmail]);

  // The challenge banner already explains the next step; don't also
  // render the backend sentence as a red error on the OTP form.
  useEffect(() => {
    if (challengeEmail && error?.toLowerCase().includes("two-factor")) {
      clearError();
    }
  }, [challengeEmail, error, clearError]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
    mode: "onTouched",
  });

  const bannerMessage = error ? localAuthErrorMessage(errorCode, t, error) : "";

  useEffect(() => {
    if (!fieldErrors || challengeEmail) return;
    applyServerFieldErrors(fieldErrors, t, setError, ["email", "password"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors]);

  const resendVerificationEmail = async () => {
    const email = lastLoginEmail.trim();
    if (!email || verificationResending) return;
    setVerificationResending(true);
    setVerificationResent(false);
    setVerificationResendFailed(false);
    try {
      await authApi.resendVerificationEmail(email);
      setVerificationResent(true);
    } catch {
      setVerificationResendFailed(true);
    } finally {
      setVerificationResending(false);
    }
  };

  const onSubmit = async (values: LoginForm) => {
    clearError();
    setVerificationResent(false);
    setVerificationResendFailed(false);
    setLastLoginEmail(values.email.trim());

    try {
      await login({
        email: values.email,
        password: values.password,
        remember: values.remember,
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
      setMfaEmail(null);
      continueAfterAuthentication(authenticatedUser ?? { roles: [] });
    } catch (caught) {
      /*
       * The auth store already stores
       * the error.
       *
       * We intentionally don't navigate
       * when authentication fails.
       */
      if (isMfaChallenge(caught)) {
        setMfaEmail(values.email.trim());
        clearError();
      }
    }
  };

  const submitMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!challengeEmail || mfaCode.length !== 6) return;
    try {
      await verifyTwoFactorLogin(challengeEmail, mfaCode);
      setMfaEmail(null);
      continueAfterAuthentication(
        useAuthStore.getState().user ?? { roles: [] },
      );
    } catch {}
  };

  const resendCode = async () => {
    if (!challengeEmail || resending) return;
    setResending(true);
    setResentNote(false);
    setResendFailed(false);
    try {
      await authApi.resendTwoFactorLogin(challengeEmail);
      setResentNote(true);
      setMfaCode("");
    } catch {
      setResendFailed(true);
    } finally {
      setResending(false);
    }
  };

  const handleGoogleAuth = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      return;
    }

    window.location.href = `${apiUrl}/v1/auth/google/redirect`;
  };

  return (
    <AuthShell>
      <div className="flex w-full flex-col justify-center">
        <AuthHeader
          eyebrow={t.login.eyebrow}
          title={t.login.title}
          description={t.login.description}
        />

        {challengeEmail ? (
          <form onSubmit={submitMfa} className="space-y-4">
            <div className="rounded-2xl border border-[#F47822]/20 bg-[#F47822]/5 p-4">
              <p className="text-sm font-bold text-[#3A3A3A]">
                {t.login.mfaTitle}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60">
                {t.login.mfaDescription.replace("{{email}}", challengeEmail)}
              </p>
            </div>
            <OtpInput
              value={mfaCode}
              onChange={(code) => {
                setMfaCode(code);
                setResentNote(false);
              }}
              disabled={isLoading}
              label={t.login.mfaCodeLabel}
              hint={t.login.mfaHint}
              digitAria={(index) =>
                t.login.mfaDigitAria.replace("{{index}}", String(index + 1))
              }
            />
            <button
              type="submit"
              disabled={isLoading || mfaCode.length !== 6}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#F47822] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#de6414] hover:shadow-[0_12px_24px_rgba(244,120,34,.24)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? t.common.loading : t.login.mfaSubmit}
            </button>
            <button
              type="button"
              onClick={() => void resendCode()}
              disabled={isLoading || resending}
              className="w-full text-xs font-semibold text-[#F47822] transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? t.login.mfaResending : t.login.mfaResend}
            </button>
            {resentNote && (
              <p role="status" className="text-center text-xs font-semibold text-emerald-600">
                {t.login.mfaResent}
              </p>
            )}
            {resendFailed && (
              <p role="alert" className="text-center text-xs font-semibold text-red-600">
                {t.login.mfaResendFail}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setMfaEmail(null);
                setMfaCode("");
                setLastLoginEmail("");
                setResentNote(false);
                setResendFailed(false);
                clearError();
              }}
              className="w-full text-xs font-semibold text-[#3A3A3A]/55 transition hover:text-[#F47822]"
            >
              {t.login.mfaDifferentAccount}
            </button>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}
          </form>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <AuthInput
              id="login-email"
              label={t.common.email}
              type="email"
              autoComplete="email"
              placeholder={t.common.emailPlaceholder}
              {...register("email", {
                required: t.common.required,
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: t.common.invalidEmail,
                },
              })}
              error={errors.email?.message}
            />

            <PasswordField
              id="login-password"
              label={t.common.password}
              autoComplete="current-password"
              placeholder="••••••••"
              showLabel={t.common.showPassword}
              hideLabel={t.common.hidePassword}
              {...register("password", {
                required: t.common.required,
              })}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-xs text-[#3A3A3A]/60">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#3A3A3A]/20 accent-[#F47822]"
                  {...register("remember")}
                />

                <span>{t.common.rememberMe}</span>
              </label>

              <Link
                to={`/forgot-password${next ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="text-xs font-medium text-[#F47822] hover:underline"
              >
                {t.common.forgotPassword}
              </Link>
            </div>

            {verificationNote === "verified" && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
              >
                {t.login.emailVerified}
              </div>
            )}

            {verificationNote === "invalid" && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {t.login.verifyLinkInvalid}
              </div>
            )}

            {bannerMessage && (
              <div
                role="alert"
                className="space-y-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <p>{bannerMessage}</p>

                {errorCode === "invalid_credentials" && (
                  <Link
                    to={`/forgot-password${next ? `?next=${encodeURIComponent(next)}` : ""}`}
                    className="inline-block font-semibold text-[#F47822] hover:underline"
                  >
                    {t.common.forgotPassword}
                  </Link>
                )}

                {errorCode === "email_not_verified" && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => void resendVerificationEmail()}
                      disabled={verificationResending}
                      className="block w-full rounded-lg border border-[#F47822]/30 bg-white px-3 py-2 text-xs font-semibold text-[#F47822] transition hover:bg-[#FFF8F4] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verificationResending
                        ? t.errors.resendVerificationSending
                        : t.errors.resendVerification}
                    </button>

                    {verificationResent && (
                      <p role="status" className="text-xs font-semibold text-emerald-600">
                        {t.errors.resendVerificationSent}
                      </p>
                    )}

                    {verificationResendFailed && (
                      <p role="alert" className="text-xs font-semibold text-red-600">
                        {t.errors.resendVerificationFailed}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#F47822] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition-all hover:bg-[#e96d18] hover:shadow-[0_10px_25px_rgba(244,120,34,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? t.common.loading : t.login.submit}
            </button>
          </form>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#3A3A3A]/10" />

          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#3A3A3A]/35">
            OR
          </span>

          <div className="h-px flex-1 bg-[#3A3A3A]/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-white text-sm font-medium text-[#3A3A3A] transition hover:bg-[#F3F3F3] focus:outline-none focus:ring-4 focus:ring-[#F47822]/10"
        >
          <GoogleIcon />

          <span>{t.common.continueWithGoogle}</span>
        </button>

        <div className="mt-5 text-center text-sm text-[#3A3A3A]/60">
          {t.common.noAccount}{" "}
          <Link
            to={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-[#F47822]"
          >
            {t.common.signUp}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

function OtpInput({
  value,
  onChange,
  disabled = false,
  label,
  hint,
  digitAria,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  hint: string;
  digitAria: (index: number) => string;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  const updateDigit = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = digits.slice();
      next[index] = "";
      onChange(next.join(""));
      return;
    }

    const next = digits.slice();
    cleaned
      .slice(0, 6 - index)
      .split("")
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    onChange(next.join("").slice(0, 6));
    inputRefs.current[Math.min(index + cleaned.length, 5)]?.focus();
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[#3A3A3A]/65">
        {label}
      </p>
      <div className="flex gap-2 sm:gap-3" dir="ltr">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            value={digit}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={digitAria(index)}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digit && index > 0) {
                inputRefs.current[index - 1]?.focus();
              }
              if (event.key === "ArrowLeft" && index > 0)
                inputRefs.current[index - 1]?.focus();
              if (event.key === "ArrowRight" && index < 5)
                inputRefs.current[index + 1]?.focus();
            }}
            onPaste={(event) => {
              event.preventDefault();
              updateDigit(index, event.clipboardData.getData("text"));
            }}
            className="h-14 min-w-0 flex-1 rounded-xl border border-[#3A3A3A]/12 bg-white text-center text-xl font-bold text-[#3A3A3A] outline-none transition-all duration-200 focus:border-[#F47822] focus:bg-[#FFF8F4] focus:ring-4 focus:ring-[#F47822]/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-[#3A3A3A]/45">
        {hint}
      </p>
    </div>
  );
}

function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : null;
}
