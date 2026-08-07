import { X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/cn";
import type { NavigationItem } from "@/config/navigation";
import { Logo } from "./Logo";

interface SidebarProps {
    items: NavigationItem[];
    open?: boolean;
    onClose?: () => void;
    collapsed?: boolean;
}

export function Sidebar({
    items,
    open = true,
    onClose,
    collapsed = false,
}: SidebarProps) {
    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50",
                    "flex flex-col",
                    "border-r border-[var(--border)]",
                    "bg-[var(--card)]",
                    "transition-transform duration-200",
                    "lg:static lg:z-auto",
                    collapsed
                        ? "w-20"
                        : "w-64",
                    open
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0",
                )}
            >
                <div
                    className={cn(
                        "flex h-16 items-center border-b border-[var(--border)] px-4",
                        collapsed
                            ? "justify-center"
                            : "justify-between",
                    )}
                >
                    <Logo collapsed={collapsed} />

                    {!collapsed && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md p-2 text-[var(--muted)] hover:bg-[var(--surface)] lg:hidden"
                            aria-label="Close navigation"
                        >
                            <X className="size-5" />
                        </button>
                    )}
                </div>

                <nav
                    aria-label="Main navigation"
                    className="flex-1 space-y-1 overflow-y-auto p-3"
                >
                    {items.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                end={item.href === "/dashboard" || item.href === "/admin"}
                                onClick={onClose}
                                title={
                                    collapsed
                                        ? item.label
                                        : undefined
                                }
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 rounded-[var(--radius-md)]",
                                        "px-3 py-2.5",
                                        "text-sm font-medium",
                                        "transition-colors",
                                        collapsed &&
                                            "justify-center px-2",
                                        isActive
                                            ? [
                                                  "bg-[var(--primary)]/10",
                                                  "text-[var(--primary)]",
                                              ]
                                            : [
                                                  "text-[var(--muted)]",
                                                  "hover:bg-[var(--surface)]",
                                                  "hover:text-[var(--foreground)]",
                                              ],
                                    )
                                }
                            >
                                <Icon className="size-5 shrink-0" />

                                {!collapsed && (
                                    <span>{item.label}</span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}