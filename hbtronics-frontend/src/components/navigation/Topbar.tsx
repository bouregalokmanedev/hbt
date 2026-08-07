import {
    Bell,
    Menu,
    Moon,
    Sun,
} from "lucide-react";

import { Button } from "@/components/ui";
import { useTheme } from "@/providers/ThemeProvider";

interface TopbarProps {
    onMenuClick?: () => void;
}

export function Topbar({
    onMenuClick,
}: TopbarProps) {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(
            theme === "dark"
                ? "light"
                : "dark",
        );
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/95 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={onMenuClick}
                    aria-label="Open navigation"
                >
                    <Menu className="size-5" />
                </Button>

                <div className="hidden sm:block">
                    <span className="text-sm font-medium text-[var(--muted)]">
                        HBTronics Learning Platform
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Sun className="size-5" />
                    ) : (
                        <Moon className="size-5" />
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                >
                    <Bell className="size-5" />
                </Button>

                <button
                    type="button"
                    className="ml-2 grid size-9 place-items-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white"
                    aria-label="Open profile menu"
                >
                    L
                </button>
            </div>
        </header>
    );
}