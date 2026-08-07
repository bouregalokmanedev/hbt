import { forwardRef, useId } from "react";

import { cn } from "@/lib/cn";

import type { InputProps } from "./input.types";

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            id,
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            className,
            required,
            ...props
        },
        ref,
    ) => {
        const generatedId = useId();

        const inputId = id ?? generatedId;

        const descriptionId = `${inputId}-description`;
        const errorId = `${inputId}-error`;

        const describedBy = error
            ? errorId
            : helperText
              ? descriptionId
              : undefined;

        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-[var(--foreground)]"
                    >
                        {label}

                        {required && (
                            <span
                                aria-hidden="true"
                                className="ml-1 text-[var(--danger)]"
                            >
                                *
                            </span>
                        )}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                        >
                            {leftIcon}
                        </span>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        required={required}
                        className={cn(
                            "h-11 w-full rounded-[var(--radius-md)] border",
                            "border-[var(--border)]",
                            "bg-[var(--background)]",
                            "px-3",
                            "text-sm text-[var(--foreground)]",
                            "placeholder:text-[var(--muted-foreground)]",
                            "outline-none",
                            "transition-colors",
                            "focus:border-[var(--ring)]",
                            "focus:ring-2",
                            "focus:ring-[var(--ring)]/20",
                            "disabled:cursor-not-allowed",
                            "disabled:opacity-50",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            error &&
                                "border-[var(--danger)] focus:border-[var(--danger)]",
                            className,
                        )}
                        {...props}
                    />

                    {rightIcon && (
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                        >
                            {rightIcon}
                        </span>
                    )}
                </div>

                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="text-sm text-[var(--danger)]"
                    >
                        {error}
                    </p>
                )}

                {!error && helperText && (
                    <p
                        id={descriptionId}
                        className="text-sm text-[var(--muted)]"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        );
    },
);

Input.displayName = "Input";