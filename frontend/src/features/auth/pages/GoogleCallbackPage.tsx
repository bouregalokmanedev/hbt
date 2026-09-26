import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { authApi } from "../api/auth.api";
import { AuthShell } from "../components/AuthShell";
import { useAuthLanguage } from "../i18n/auth-language";
import { useAuthStore } from "../store/auth.store";
import { authStorage } from "@/lib/storage/auth-storage";
import { dashboardRouteFor } from "../utils/dashboard-route";

export function GoogleCallbackPage() {
    const { t } = useAuthLanguage();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialize = useAuthStore((state) => state.initialize);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");

        if (!code) {
            setError(t.google.genericError);
            return;
        }

        const exchangeCode = code;

        async function finishGoogleSignIn() {
            try {
                const authentication = await authApi.exchangeGoogleCode(exchangeCode);
                authStorage.setToken(authentication.token);
                await initialize();
                sessionStorage.removeItem("hbt:auth-return-to");
                navigate(dashboardRouteFor(useAuthStore.getState().user), { replace: true });
            } catch (caughtError) {
                setError(caughtError instanceof Error ? caughtError.message : t.google.genericError);
            }
        }

        void finishGoogleSignIn();
    }, [initialize, navigate, searchParams, t]);

    return (
        <AuthShell>
            <div className="flex w-full flex-col items-center justify-center text-center">
                {error ? (
                    <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h1 className="mt-5 text-xl font-bold text-[#3A3A3A]">{t.google.title}</h1>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-[#3A3A3A]/55">{error}</p>
                        <Link to="/login" className="mt-6 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#df6819]">{t.common.backToLogin}</Link>
                    </>
                ) : (
                    <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                        <h1 className="mt-5 text-xl font-bold text-[#3A3A3A]">{t.google.signingIn}</h1>
                        <p className="mt-2 text-sm text-[#3A3A3A]/55">{t.google.finishing}</p>
                    </>
                )}
            </div>
        </AuthShell>
    );
}
