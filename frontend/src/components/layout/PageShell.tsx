import type { PropsWithChildren } from "react";

import { cn } from "@/lib/cn";

interface PageShellProps extends PropsWithChildren {
    className?: string;
}

export function PageShell({
    children,
    className,
}: PageShellProps) {
    return (
        <div
            className={cn(
                "min-h-full",
                "bg-[var(--background)]",
                "px-4 py-6",
                "sm:px-6 sm:py-8",
                "lg:px-8",
                className,
            )}
        >
            {children}
        </div>
    );
}