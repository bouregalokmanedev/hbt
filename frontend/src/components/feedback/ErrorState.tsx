import { AlertTriangle, RefreshCw } from "lucide-react";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
}

export function ErrorState({
    title,
    description,
    onRetry,
}: ErrorStateProps) {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border)] p-8 text-center">
            <div className="mb-4 grid size-12 place-items-center rounded-full bg-[var(--danger-background)]">
                <AlertTriangle className="size-5 text-[var(--danger)]" />
            </div>

            <h3 className="font-semibold">
                {title ?? t("errors.somethingWentWrong")}
            </h3>

            <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
                {description ?? t("errors.tryAgainBody")}
            </p>

            {onRetry && (
                <Button
                    variant="outline"
                    className="mt-5"
                    onClick={onRetry}
                    leftIcon={
                        <RefreshCw className="size-4" />
                    }
                >
                    {t("common.tryAgain")}
                </Button>
            )}
        </div>
    );
}
