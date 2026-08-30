import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui";

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
}

export function ErrorState({
    title = "Something went wrong",
    description = "We couldn't load this content. Please try again.",
    onRetry,
}: ErrorStateProps) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border)] p-8 text-center">
            <div className="mb-4 grid size-12 place-items-center rounded-full bg-[var(--danger-background)]">
                <AlertTriangle className="size-5 text-[var(--danger)]" />
            </div>

            <h3 className="font-semibold">
                {title}
            </h3>

            <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
                {description}
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
                    Try again
                </Button>
            )}
        </div>
    );
}