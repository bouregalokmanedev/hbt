import {
    Navigate,
    Outlet,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MailCheck, RefreshCw, LogOut, Send } from "lucide-react";

import {
    useAuth,
} from "../hooks/useAuth";
import { authApi } from "../api/auth.api";

export function AuthGuard() {
    const {
        user,
        isLoading,
        isInitialized,
        initialize,
        logout,
    } = useAuth();
    const { t } = useTranslation();
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);
    // Mirror the server-side throttle so the button never races into a 429.
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = window.setInterval(() => {
            setCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [cooldown]);

    const resend = async () => {
        if (cooldown > 0) return;
        setResending(true);
        setResendError(null);
        try {
            await authApi.resendVerification();
            setResent(true);
            setCooldown(60);
        } catch (cause) {
            setResendError(
                cause instanceof Error
                    ? cause.message
                    : t("verifyEmailGate.resendFailed"),
            );
        } finally {
            setResending(false);
        }
    };

    if (
        !isInitialized ||
        isLoading
    ) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />

                    <p className="mt-4 text-sm text-muted-foreground">
                        {t("verifyEmailGate.checking")}
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (!user.email_verified_at) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-5">
                <section className="w-full max-w-md overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-white shadow-[0_16px_45px_rgba(58,58,58,0.12)]">
                    <div className="h-1.5 bg-[#F47822]" />
                    <div className="p-7 text-center sm:p-8">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10"><MailCheck className="h-7 w-7 text-[#F47822]" /></div>
                        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("verifyEmailGate.eyebrow")}</p>
                        <h1 className="mt-2 text-xl font-bold text-[#3A3A3A]">{t("verifyEmailGate.title")}</h1>
                        <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/55">{t("verifyEmailGate.body", { email: user.email })}</p>
                        <button type="button" onClick={() => void initialize()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#df6817]"><RefreshCw className="h-4 w-4" />{t("verifyEmailGate.checked")}</button>
                        <button type="button" onClick={() => void resend()} disabled={resending || cooldown > 0} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] px-4 py-3 text-sm font-semibold text-[#F47822] transition hover:bg-[#FDEEE5] disabled:opacity-60"><Send className="h-4 w-4" />{cooldown > 0 ? `${t("verifyEmailGate.resendWait")} ${cooldown}s` : resending ? t("verifyEmailGate.sending") : resent ? t("verifyEmailGate.sent") : t("verifyEmailGate.resend")}</button>
                        {resendError && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600">{resendError}</p>}
                        <button type="button" onClick={() => void logout()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#3A3A3A]/10 px-4 py-3 text-sm font-semibold text-[#3A3A3A]/60 transition hover:bg-[#F7F7F7]"><LogOut className="h-4 w-4" />{t("verifyEmailGate.signOut")}</button>
                    </div>
                </section>
            </div>
        );
    }

    return <Outlet />;
}
