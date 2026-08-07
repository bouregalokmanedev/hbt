import { X } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";

interface MobileMenuProps {
    open: boolean;
    onClose: () => void;
}

export function MobileMenu({
    open,
    onClose,
}: MobileMenuProps) {
    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/40"
                />
            )}

            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-50 w-[min(85vw,360px)]",
                    "border-l border-[var(--border)]",
                    "bg-[var(--card)]",
                    "p-5 shadow-2xl",
                    "transition-transform duration-200",
                    open
                        ? "translate-x-0"
                        : "translate-x-full",
                )}
            >
                <div className="flex items-center justify-between">
                    <span className="font-semibold">
                        Menu
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-2 hover:bg-[var(--surface)]"
                        aria-label="Close menu"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <nav className="mt-8 flex flex-col gap-2">
                    <Link
                        to="/courses"
                        onClick={onClose}
                        className="rounded-md px-3 py-3 text-sm font-medium hover:bg-[var(--surface)]"
                    >
                        Courses
                    </Link>

                    <Link
                        to="/about"
                        onClick={onClose}
                        className="rounded-md px-3 py-3 text-sm font-medium hover:bg-[var(--surface)]"
                    >
                        About
                    </Link>

                    <Link
                        to="/contact"
                        onClick={onClose}
                        className="rounded-md px-3 py-3 text-sm font-medium hover:bg-[var(--surface)]"
                    >
                        Contact
                    </Link>
                </nav>
            </div>
        </>
    );
}