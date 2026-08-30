import {
    Activity,
    BarChart3,
    BellRing,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    MonitorCog,
    MessageCircle,
    Users,
    UserRoundCheck,
    X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "@/features/auth";

const navigation = [
    { label: "Overview", to: "/admin", icon: LayoutDashboard },
    { label: "People", to: "/admin/users", icon: Users },
    { label: "Course review", to: "/admin/courses", icon: BookOpen },
    { label: "Enrollments", to: "/admin/enrollments", icon: UserRoundCheck },
    { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
    { label: "Activity log", to: "/admin/activity", icon: Activity },
    { label: "Announcements", to: "/admin/announcements", icon: BellRing },
    { label: "System health", to: "/admin/system", icon: MonitorCog },
    { label: "Messages", to: "/admin/messages", icon: MessageCircle },
];

interface Props { open: boolean; collapsed: boolean; onClose(): void; onToggle(): void; }

export function AdminSidebar({ open, collapsed, onClose, onToggle }: Props) {
    const { user, logout } = useAuth();
    const initials = `${user?.first_name?.[0] ?? "A"}${user?.last_name?.[0] ?? "D"}`.toUpperCase();

    return <>
        {open && <button type="button" aria-label="Close administration navigation" onClick={onClose} className="fixed inset-0 z-40 bg-[#3A3A3A]/30 backdrop-blur-sm lg:hidden" />}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-[#3A3A3A]/8 bg-[#FCFCFC] shadow-[12px_0_40px_rgba(58,58,58,.07)] transition-all duration-300 ${collapsed ? "lg:w-[78px]" : "lg:w-[272px]"} ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
            <div className={`flex h-[76px] shrink-0 items-center border-b border-[#3A3A3A]/7 bg-white/80 px-5 ${collapsed ? "justify-center px-0" : "justify-between"}`}>
                {!collapsed ? <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#F47822]">HBT Learning</p><p className="mt-1 text-sm font-semibold text-[#3A3A3A]">Administration</p></div> : <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#3A3A3A] text-xs font-bold text-white">H</span>}
                <button type="button" onClick={onToggle} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} className="hidden h-8 w-8 items-center justify-center rounded-lg text-[#3A3A3A]/45 transition hover:bg-[#F47822]/10 hover:text-[#F47822] lg:flex">{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
                <button type="button" onClick={onClose} aria-label="Close navigation" className="grid h-8 w-8 place-items-center rounded-lg text-[#3A3A3A]/45 lg:hidden"><X className="h-4 w-4" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-5">
                {!collapsed && <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[#3A3A3A]/32">Platform control</p>}
                <div className="space-y-1">{navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} end={to === "/admin"} onClick={onClose} title={collapsed ? label : undefined} className={({ isActive }) => `flex h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold transition-all ${isActive ? "bg-[#F47822] text-white shadow-[0_8px_18px_rgba(244,120,34,.2)]" : "text-[#3A3A3A]/58 hover:bg-white hover:text-[#3A3A3A] hover:shadow-sm"} ${collapsed ? "justify-center px-0" : ""}`}><Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}</NavLink>)}</div>
            </nav>
            <div className="border-t border-[#3A3A3A]/8 p-3">
                {!collapsed && <div className="mb-3 flex items-center gap-3 rounded-xl bg-white p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#F47822]/12 text-xs font-bold text-[#F47822]">{initials}</div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#3A3A3A]">{user?.first_name} {user?.last_name}</p><p className="mt-0.5 text-[10px] text-[#3A3A3A]/42">Platform administrator</p></div></div>}
                <button type="button" onClick={() => void logout()} title={collapsed ? "Logout" : undefined} className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-[#3A3A3A]/48 transition hover:bg-red-50 hover:text-red-600 ${collapsed ? "justify-center px-0" : ""}`}><LogOut className="h-4 w-4" />{!collapsed && "Sign out"}</button>
            </div>
        </aside>
    </>;
}
