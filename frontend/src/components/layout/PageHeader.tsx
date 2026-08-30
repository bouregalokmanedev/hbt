import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <header
            className={cn(
                "flex flex-col gap-4",
                "sm:flex-row sm:items-start sm:justify-between",
                className,
            )}
        >
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
                    {title}
                </h1>

                {description && (
                    <p className="max-w-2xl text-sm text-[var(--muted)] sm:text-base">
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex shrink-0 items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}