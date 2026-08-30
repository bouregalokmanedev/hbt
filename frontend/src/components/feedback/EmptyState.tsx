import type { ReactNode } from "react";

import { Inbox } from "lucide-react";

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] p-8 text-center">
            <div className="mb-4 grid size-12 place-items-center rounded-full bg-[var(--surface)]">
                <Inbox className="size-5 text-[var(--muted)]" />
            </div>

            <h3 className="font-semibold text-[var(--foreground)]">
                {title}
            </h3>

            {description && (
                <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
                    {description}
                </p>
            )}

            {action && (
                <div className="mt-5">
                    {action}
                </div>
            )}
        </div>
    );
}