import {
    Navigate,
    Outlet,
} from "react-router-dom";
import { MailCheck, RefreshCw, LogOut } from "lucide-react";

import {
    useAuth,
} from "../hooks/useAuth";

export function AuthGuard() {
    const {
        user,
        isLoading,
        isInitialized,
        initialize,
        logout,
    } = useAuth();

    if (
        !isInitialized ||
        isLoading
    ) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />

                    <p className="mt-4 text-sm text-muted-foreground">
                        Checking your session...
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
                        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">Verification required</p>
                        <h1 className="mt-2 text-xl font-bold text-[#3A3A3A]">Verify your email to continue</h1>
                        <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/55">We sent a verification link to <strong className="font-semibold text-[#3A3A3A]">{user.email}</strong>. Open it, then come back here to unlock your learning dashboard.</p>
                        <button type="button" onClick={() => void initialize()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#df6817]"><RefreshCw className="h-4 w-4" />I've verified my email</button>
                        <button type="button" onClick={() => void logout()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#3A3A3A]/10 px-4 py-3 text-sm font-semibold text-[#3A3A3A]/60 transition hover:bg-[#F7F7F7]"><LogOut className="h-4 w-4" />Sign out</button>
                    </div>
                </section>
            </div>
        );
    }

    return <Outlet />;
}
