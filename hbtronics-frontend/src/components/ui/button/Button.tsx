import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

import { buttonVariants } from "./button.variants";
import type { ButtonProps } from "./button.types";

export function Button({
    className,
    variant,
    size,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            type={props.type ?? "button"}
            className={cn(
                buttonVariants({
                    variant,
                    size,
                }),
                className,
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2
                    aria-hidden="true"
                    className="size-4 animate-spin"
                />
            ) : (
                leftIcon
            )}

            <span>{children}</span>

            {!loading && rightIcon}
        </button>
    );
}