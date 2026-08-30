import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

interface DashboardNavItemProps {
    label: string;
    to: string;
    icon: LucideIcon;
    collapsed?: boolean;
    onClick?: () => void;
}

export function DashboardNavItem({
    label,
    to,
    icon: Icon,
    collapsed = false,
    onClick,
}: DashboardNavItemProps) {
    return (
        <NavLink
            to={to}
            end
            onClick={onClick}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
                `
                group
                relative
                flex
                h-10
                items-center
                gap-3
                rounded-xl
                px-3
                text-xs
                font-medium
                transition-all
                duration-200
                ${
                    isActive
                        ? "bg-[#F47822]/10 text-[#F47822]"
                        : "text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A]"
                }
                ${collapsed ? "justify-center px-0" : ""}
                `
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-[#F47822]" />
                    )}

                    <Icon
                        className={`
                            h-4 w-4 shrink-0
                            transition-colors
                            ${
                                isActive
                                    ? "text-[#F47822]"
                                    : "text-[#3A3A3A]/40 group-hover:text-[#3A3A3A]"
                            }
                        `}
                    />

                    {!collapsed && (
                        <span>{label}</span>
                    )}
                </>
            )}
        </NavLink>
    );
}