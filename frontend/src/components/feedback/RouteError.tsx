import {
    isRouteErrorResponse,
    useNavigate,
    useRouteError,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

/**
 * Rendered by the router whenever a route module fails to load or a loader
 * throws — without it the SPA would show a blank screen.
 */
export function RouteError() {
    const error = useRouteError();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const notFound = isRouteErrorResponse(error) && error.status === 404;

    if (notFound) {
        return (
            <main className="grid min-h-screen place-items-center px-6">
                <div className="text-center">
                    <p className="text-6xl font-bold text-[var(--primary)]">404</p>
                    <h1 className="mt-4 text-2xl font-semibold">
                        {t("errors.notFoundTitle")}
                    </h1>
                    <p className="mt-2 text-[var(--muted)]">
                        {t("errors.notFoundBody")}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        <Home className="h-4 w-4" />
                        {t("errors.backHome")}
                    </button>
                </div>
            </main>
        );
    }

    // The thrown value can be a chunk-load failure, a TypeError or an HTTP
    // status line — none of that belongs on screen, so it only goes to the
    // console (and only where we are looking at it anyway).
    if (import.meta.env.DEV) {
        console.error("Route failed to render", error);
    }

    return (
        <main className="grid min-h-screen place-items-center bg-[#FAFAFA] px-6">
            <div className="w-full max-w-md rounded-3xl border border-[#3A3A3A]/10 bg-white p-8 text-center shadow-[0_16px_45px_rgba(58,58,58,0.12)]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h1 className="mt-5 text-xl font-bold text-[#3A3A3A]">
                    {t("errors.somethingWentWrong")}
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55">
                    {t("errors.tryAgainBody")}
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E96D18]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        {t("errors.retry")}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3A3A3A]/10 px-5 py-2.5 text-sm font-semibold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                    >
                        <Home className="h-4 w-4" />
                        {t("errors.backHome")}
                    </button>
                </div>
            </div>
        </main>
    );
}
