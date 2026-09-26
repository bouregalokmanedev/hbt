import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CourseErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function CourseErrorState({ message, onRetry }: CourseErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="course-error"
      className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </span>

      <h3 className="mt-4 text-lg font-semibold text-[#3A3A3A] dark:text-white">
        {t("catalogPage.error.title")}
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition hover:bg-[#df6817]"
      >
        <RotateCcw className="h-4 w-4" />
        {t("catalogPage.error.retry")}
      </button>
    </div>
  );
}
