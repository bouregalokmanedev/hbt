import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";

interface LogoProps {
    collapsed?: boolean;
    className?: string;
}

export function Logo({
    collapsed = false,
    className,
}: LogoProps) {
    return (
        <Link
            to="/"
            aria-label="HBTronics home"
            className={cn(
                "inline-flex items-center gap-2.5",
                "font-semibold tracking-tight",
                "text-[var(--foreground)]",
                className,
            )}
        >
            <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--primary)] text-sm font-bold text-white">
                H
            </span>

            {!collapsed && (
                <span className="text-lg">
                    HBTronics
                </span>
            )}
        </Link>
    );
}