import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";

/* =========================================================
   ACTION BUTTONS
   One primitive for every admin action: brand-orange primary,
   outlined secondary, quiet ghost, and semantic danger/success.
   ========================================================= */

export type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type AdminButtonSize = "sm" | "md";

const ADMIN_BUTTON_VARIANTS: Record<AdminButtonVariant, string> = {
    primary: [
        "bg-[#F47822] text-white",
        "shadow-[0_10px_22px_-12px_rgba(244,120,34,0.95)]",
        "hover:-translate-y-0.5 hover:bg-[#df6817]",
        "hover:shadow-[0_16px_30px_-12px_rgba(244,120,34,1)]",
        "active:translate-y-0",
    ].join(" "),

    secondary: [
        "border border-[#3A3A3A]/12 bg-white text-[#3A3A3A]/70",
        "hover:-translate-y-0.5 hover:border-[#F47822]/45 hover:bg-[#FFF8F4] hover:text-[#F47822]",
        "hover:shadow-[0_10px_20px_-14px_rgba(244,120,34,0.8)]",
        "active:translate-y-0",
    ].join(" "),

    ghost: "bg-transparent text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/6 hover:text-[#3A3A3A]",

    danger: [
        "border border-red-200 bg-red-50 text-red-600",
        "hover:border-red-600 hover:bg-red-600 hover:text-white",
    ].join(" "),

    success: [
        "border border-emerald-200 bg-emerald-50 text-emerald-700",
        "hover:border-emerald-600 hover:bg-emerald-600 hover:text-white",
    ].join(" "),
};

const ADMIN_BUTTON_SIZES: Record<AdminButtonSize, string> = {
    sm: "h-8 rounded-lg px-3 text-[11px]",
    md: "h-11 rounded-xl px-4 text-xs",
};

const ADMIN_BUTTON_BASE = [
    "inline-flex items-center justify-center gap-1.5",
    "whitespace-nowrap font-bold tracking-[0.01em]",
    "outline-none transition-all duration-200",
    "focus-visible:ring-2 focus-visible:ring-[#F47822]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "disabled:pointer-events-none disabled:opacity-45",
].join(" ");

export function AdminButton({
    variant = "secondary",
    size = "md",
    className,
    children,
    type = "button",
    ...props
}: {
    variant?: AdminButtonVariant;
    size?: AdminButtonSize;
} & ComponentPropsWithoutRef<"button">) {
    return (
        <button
            {...props}
            type={type}
            className={cn(ADMIN_BUTTON_BASE, ADMIN_BUTTON_VARIANTS[variant], ADMIN_BUTTON_SIZES[size], className)}
        >
            {children}
        </button>
    );
}

/* =========================================================
   SELECTS
   Native selects dressed consistently: same heights and radii
   as AdminButton, chevron pinned to the inline end (RTL-safe).
   ========================================================= */

export function AdminSelect({
    value,
    onChange,
    options,
    ariaLabel,
    size = "md",
    disabled = false,
    className,
}: {
    value: string;
    onChange(value: string): void;
    options: Array<{ value: string; label: string }>;
    ariaLabel?: string;
    size?: AdminButtonSize;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("relative inline-block", className)}>
            <select
                value={value}
                disabled={disabled}
                aria-label={ariaLabel}
                onChange={(event) => onChange(event.target.value)}
                className={cn(
                    "cursor-pointer appearance-none bg-white ps-3 pe-8 font-semibold text-[#3A3A3A] outline-none transition",
                    "border border-[#3A3A3A]/12 hover:border-[#3A3A3A]/30",
                    "focus:border-[#F47822] focus:ring-2 focus:ring-[#F47822]/15",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    size === "sm" ? "h-8 rounded-lg text-[11px]" : "h-11 rounded-xl text-xs",
                )}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute end-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#3A3A3A]/40"
            />
        </div>
    );
}

export function AdminHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
    return <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#F47822]">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A] sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/50">{description}</p></div>{action}</div>;
}

export function AdminPanel({ children, className = "", ...rest }: { children: ReactNode; className?: string } & Omit<ComponentPropsWithoutRef<"section">, "children" | "className">) {
    return <section {...rest} className={`rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6 ${className}`}>{children}</section>;
}

export function Metric({ label, value, detail, accent = false, icon }: { label: string; value: string | number; detail: string; accent?: boolean; icon?: ReactNode }) {
    return <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-[0_8px_22px_rgba(58,58,58,.035)] transition-shadow duration-200 hover:shadow-[0_13px_28px_rgba(58,58,58,.08)] ${accent ? "border-[#F47822]/20 bg-[#FFF8F4]" : "border-[#3A3A3A]/8 bg-white"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold leading-5 text-[#3A3A3A]/65">{label}</p><p className="mt-1 text-[1.7rem] font-semibold leading-tight tracking-tight text-[#3A3A3A]">{value}</p></div>{icon && <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accent ? "bg-[#F47822] text-white" : "bg-[#FFF1E8] text-[#F47822]"}`}>{icon}</span>}</div><p className="mt-2 text-xs leading-5 text-[#3A3A3A]/55">{detail}</p><div className={`absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${accent ? "bg-[#F47822]" : "bg-[#F47822]/60"}`} /></div>;
}

export function Status({ value }: { value: string }) {
    const normalized = value.toLowerCase();
    const color = normalized === "published" || normalized === "active" || normalized === "completed" || normalized === "healthy" || normalized === "operational" ? "bg-emerald-50 text-emerald-700" : normalized === "review" || normalized === "pending" || normalized === "configured" ? "bg-amber-50 text-amber-700" : normalized === "suspended" || normalized === "cancelled" || normalized === "unavailable" || normalized === "degraded" ? "bg-red-50 text-red-700" : "bg-[#3A3A3A]/6 text-[#3A3A3A]/60";
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${color}`}>{value.replaceAll("_", " ")}</span>;
}

export function LoadingAdminPage() { return <div className="space-y-6"><div className="h-40 animate-pulse rounded-3xl bg-[#3A3A3A]/6" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-[#3A3A3A]/6" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-[#3A3A3A]/6" /></div>; }

export function ErrorAdminPage({ onRetry, title, description, retryLabel }: { onRetry(): void; title?: string; description?: string; retryLabel?: string }) {
    const { t } = useTranslation();
    return <AdminPanel className="border-red-200 bg-red-50"><h2 className="text-lg font-semibold text-red-900">{title ?? t("admin.common.errorTitle")}</h2><p className="mt-2 text-sm text-red-700">{description ?? t("admin.common.errorDesc")}</p><AdminButton variant="danger" size="md" onClick={onRetry} className="mt-5"><RefreshCw className="h-4 w-4" />{retryLabel ?? t("admin.common.retry")}</AdminButton></AdminPanel>;
}

export function SectionLink({ to, children }: { to: string; children: ReactNode }) { return <Link to={to} className="inline-flex items-center gap-1 text-xs font-bold text-[#F47822] transition hover:text-[#d95d0d]">{children}<ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" /></Link>; }

export function PageControls({ page, lastPage, onPage }: { page: number; lastPage: number; onPage(page: number): void }) {
    const { t } = useTranslation();
    if (lastPage <= 1) return null;
    return <div className="flex items-center justify-between gap-3 border-t border-[#3A3A3A]/7 pt-4 text-xs"><p className="font-semibold text-[#3A3A3A]/45">{t("admin.common.pageOf", { page, last: lastPage })}</p><div className="flex gap-2"><AdminButton variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><ArrowLeft className="size-3.5 rtl:-scale-x-100" />{t("admin.common.prev")}</AdminButton><AdminButton variant="primary" size="sm" disabled={page >= lastPage} onClick={() => onPage(page + 1)}>{t("admin.common.next")}<ArrowRight className="size-3.5 rtl:-scale-x-100" /></AdminButton></div></div>;
}
