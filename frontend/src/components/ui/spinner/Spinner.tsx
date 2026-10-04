import { Loader2 } from "lucide-react";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function Spinner({
    size = "md",
    className,
}: SpinnerProps) {
    const { t } = useTranslation();

    return (
        <Loader2
            aria-label={t("common.loading")}
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