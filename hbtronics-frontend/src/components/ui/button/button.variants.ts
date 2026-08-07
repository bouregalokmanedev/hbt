import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    [
        "inline-flex",
        "items-center",
        "justify-center",
        "gap-2",
        "whitespace-nowrap",
        "rounded-[var(--radius-md)]",
        "font-medium",
        "transition-colors",
        "duration-200",
        "outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-[var(--ring)]",
        "focus-visible:ring-offset-2",
        "disabled:pointer-events-none",
        "disabled:opacity-50",
    ],
    {
        variants: {
            variant: {
                primary: [
                    "bg-[var(--primary)]",
                    "text-[var(--primary-foreground)]",
                    "hover:bg-[var(--primary-hover)]",
                ],

                secondary: [
                    "bg-[var(--foreground)]",
                    "text-[var(--background)]",
                    "hover:opacity-90",
                ],

                outline: [
                    "border",
                    "border-[var(--border)]",
                    "bg-transparent",
                    "text-[var(--foreground)]",
                    "hover:bg-[var(--surface)]",
                ],

                ghost: [
                    "bg-transparent",
                    "text-[var(--foreground)]",
                    "hover:bg-[var(--surface)]",
                ],

                danger: [
                    "bg-[var(--danger)]",
                    "text-white",
                    "hover:opacity-90",
                ],
            },

            size: {
                sm: "h-9 px-3 text-sm",

                md: "h-10 px-4 text-sm",

                lg: "h-12 px-6 text-base",

                icon: "size-10",
            },
        },

        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);