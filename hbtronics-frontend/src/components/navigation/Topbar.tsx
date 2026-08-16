import {
    Bell,
    Menu,
    Search,
} from "lucide-react";

import {
    useAuth,
} from "@/features/auth";

interface TopbarProps {
    onMenuClick: () => void;
}

export function Topbar({
    onMenuClick,
}: TopbarProps) {
    const {
        user,
    } = useAuth();

    const initials =
        [
            user?.first_name,
            user?.last_name,
        ]
            .filter(Boolean)
            .map(
                (name) =>
                    name?.[0],
            )
            .join("")
            .toUpperCase() || "U";

    return (
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

                {/* Mobile menu */}
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open navigation"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
                >
                    <Menu
                        size={20}
                    />
                </button>

                {/* Search */}
                <div className="relative hidden max-w-md flex-1 md:block">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />

                    <input
                        type="search"
                        placeholder="Search courses, lessons..."
                        className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary"
                    />
                </div>

                {/* Right actions */}
                <div className="ml-auto flex items-center gap-3">

                    {/* Notifications */}
                    <button
                        type="button"
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Notifications"
                    >
                        <Bell
                            size={19}
                        />

                        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    </button>

                    <div className="h-8 w-px bg-border" />

                    {/* User */}
                    <button
                        type="button"
                        className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-muted"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {initials}
                        </div>

                        <div className="hidden text-left sm:block">
                            <div className="text-sm font-medium">
                                {user?.first_name}{" "}
                                {user?.last_name}
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Student
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
}