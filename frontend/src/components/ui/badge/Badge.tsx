import { cn } from "@/lib/cn";

import type { BadgeProps } from "./badge.types";

export function Badge({
    children,
    variant = "default",
    className,
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1",
                "text-xs font-medium",
                {
                    "bg-[var(--surface)] text-[var(--foreground)]":
                        variant === "default",

                    "bg-[var(--success-background)] text-[var(--success)]":
                        variant === "success",

                    "bg-[var(--warning-background)] text-[var(--warning)]":
                        variant === "warning",

                    "bg-[var(--danger-background)] text-[var(--danger)]":
                        variant === "danger",

                    "bg-[var(--info-background)] text-[var(--info)]":
                        variant === "info",

                    "border border-[var(--border)] bg-transparent":
                        variant === "outline",
                },
                className,
            )}
        >
            {children}
        </span>
    );
}