import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    interactive?: boolean;
}

export function Card({
    className,
    interactive = false,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                "rounded-[var(--radius-xl)]",
                "border",
                "border-[var(--border)]",
                "bg-[var(--card)]",
                "shadow-[var(--shadow-card)]",
                interactive && [
                    "cursor-pointer",
                    "transition-all",
                    "duration-200",
                    "hover:-translate-y-0.5",
                    "hover:shadow-lg",
                ],
                className,
            )}
            {...props}
        />
    );
}