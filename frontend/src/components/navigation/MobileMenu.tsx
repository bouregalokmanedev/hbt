import { X } from "lucide-react";
import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";

interface MobileMenuProps {
    open: boolean;
    onClose: () => void;
}

export function MobileMenu({
    open,
    onClose,
}: MobileMenuProps) {
    const { t } = useTranslation();

    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label={t("navigation.closeMenu")}
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
                        {t("navigation.menu")}
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-2 hover:bg-[var(--surface)]"
                        aria-label={t("navigation.closeMenu")}
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
                        {t("navigation.courses")}
                    </Link>

                    <Link
                        to="/about"
                        onClick={onClose}
                        className="rounded-md px-3 py-3 text-sm font-medium hover:bg-[var(--surface)]"
                    >
                        {t("navigation.about")}
                    </Link>

                    <Link
                        to="/contact"
                        onClick={onClose}
                        className="rounded-md px-3 py-3 text-sm font-medium hover:bg-[var(--surface)]"
                    >
                        {t("navigation.contact")}
                    </Link>
                </nav>
            </div>
        </>
    );
}
