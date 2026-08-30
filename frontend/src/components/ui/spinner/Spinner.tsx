import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function Spinner({
    size = "md",
    className,
}: SpinnerProps) {
    return (
        <Loader2
            aria-label="Loading"
            role="status"
            className={cn(
                "animate-spin text-[var(--primary)]",
                {
                    "size-4": size === "sm",
                    "size-5": size === "md",
                    "size-7": size === "lg",
                },
                className,
            )}
        />
    );
}