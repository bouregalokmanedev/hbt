import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({
    items,
    className,
}: BreadcrumbProps) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn(
                "flex items-center gap-1.5 text-sm",
                className,
            )}
        >
            <Link
                to="/"
                aria-label="Home"
                className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
                <Home className="size-4" />
            </Link>

            {items.map((item, index) => (
                <div
                    key={`${item.label}-${index}`}
                    className="flex items-center gap-1.5"
                >
                    <ChevronRight
                        aria-hidden="true"
                        className="size-3.5 text-[var(--muted-foreground)]"
                    />

                    {item.href ? (
                        <Link
                            to={item.href}
                            className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className="font-medium text-[var(--foreground)]"
                            aria-current="page"
                        >
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}