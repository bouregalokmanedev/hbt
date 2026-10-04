import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

function ErrorFallback() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background p-8">
      <div
        role="alert"
        className="mx-auto mt-16 max-w-lg rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10"
      >
        <AlertTriangle className="mx-auto h-9 w-9 text-red-600 dark:text-red-400" />
        <h1 className="mt-4 text-xl font-bold text-red-800 dark:text-red-300">
          {t("common.errorBoundaryTitle")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-400">
          {t("common.errorBoundaryBody")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#df6817]"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.errorBoundaryReload")}
          </button>
          <button
            type="button"
            onClick={() => window.location.assign("/dashboard")}
            className="rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/20"
          >
            {t("common.errorBoundaryHome")}
          </button>
        </div>
      </div>
    </main>
  );
}

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    if (import.meta.env.DEV) {
      console.error("Unhandled render error", error, info);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
