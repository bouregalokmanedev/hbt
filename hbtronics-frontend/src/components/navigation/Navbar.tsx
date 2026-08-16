
import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ChevronDown,
    ChevronRight,
    LogOut,
    Menu,
    Settings,
    UserCircle,
    X,
    LayoutDashboard,
} from "lucide-react";

import {
    Link,
    NavLink,
    useLocation,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";


const navigation = [
    {
        label: "Pricing",
        href: "/pricing",
    },
    {
        label: "Company",
        href: "/company",
    },
    {
        label: "Courses",
        href: "/catalog",
    },
    {
        label: "Store",
        href: "/store",
    },
    {
        label: "Contact",
        href: "/contact",
    },
];


function getInitials(
    firstName?: string | null,
    lastName?: string | null,
): string {
    const first =
        firstName?.trim().charAt(0) ?? "";

    const last =
        lastName?.trim().charAt(0) ?? "";

    const initials =
        `${first}${last}`.trim();

    if (!initials) {
        return "U";
    }

    return initials.toUpperCase();
}


function getRole(
    roles?: unknown,
): string {
    if (!Array.isArray(roles)) {
        return "Student";
    }

    const role = roles[0];

    if (typeof role === "string") {
        return role;
    }

    if (
        typeof role === "object" &&
        role !== null &&
        "name" in role &&
        typeof role.name === "string"
    ) {
        return role.name;
    }

    return "Student";
}


function formatRole(
    role: string,
): string {
    return role
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
}


export function Navbar() {
    const {
        user,
        logout,
    } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [isScrolled, setIsScrolled] =
        useState(false);

    const [isMenuOpen, setIsMenuOpen] =
        useState(false);

    const [isProfileOpen, setIsProfileOpen] =
        useState(false);

    const profileRef =
        useRef<HTMLDivElement | null>(null);


    const isAuthenticated =
        Boolean(user);


    const firstName =
        user?.first_name ?? "";

    const lastName =
        user?.last_name ?? "";

    const fullName =
        `${firstName} ${lastName}`.trim() ||
        "Student";

    const email =
        user?.email ?? "";

    const role =
        formatRole(
            getRole(user?.roles),
        );

    const initials =
        getInitials(
            firstName,
            lastName,
        );


    /*
     * -------------------------------------------------------
     * SCROLL EFFECT
     * -------------------------------------------------------
     */

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(
                window.scrollY > 24,
            );
        };

        handleScroll();

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true },
        );

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll,
            );
        };
    }, []);


    /*
     * -------------------------------------------------------
     * CLOSE PROFILE DROPDOWN WHEN CLICKING OUTSIDE
     * -------------------------------------------------------
     */

    useEffect(() => {
        function handlePointerDown(
            event: MouseEvent,
        ) {
            if (
                profileRef.current &&
                !profileRef.current.contains(
                    event.target as Node,
                )
            ) {
                setIsProfileOpen(false);
            }
        }

        if (isProfileOpen) {
            document.addEventListener(
                "mousedown",
                handlePointerDown,
            );
        }

        return () => {
            document.removeEventListener(
                "mousedown",
                handlePointerDown,
            );
        };
    }, [isProfileOpen]);


    /*
     * -------------------------------------------------------
     * ESCAPE KEY
     * -------------------------------------------------------
     */

    useEffect(() => {
        function handleEscape(
            event: KeyboardEvent,
        ) {
            if (event.key !== "Escape") {
                return;
            }

            setIsProfileOpen(false);
            setIsMenuOpen(false);
        }

        document.addEventListener(
            "keydown",
            handleEscape,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape,
            );
        };
    }, []);


    /*
     * -------------------------------------------------------
     * CLOSE MOBILE MENU AFTER ROUTE CHANGE
     * -------------------------------------------------------
     */

    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
    }, [location.pathname]);


    /*
     * -------------------------------------------------------
     * LOGOUT
     * -------------------------------------------------------
     */

    async function handleLogout() {
        setIsProfileOpen(false);
        setIsMenuOpen(false);

        try {
            await logout();
        } finally {
            navigate("/login");
        }
    }


    /*
     * -------------------------------------------------------
     * NAV LINK CLASS
     * -------------------------------------------------------
     */

    function navLinkClass({
        isActive,
    }: {
        isActive: boolean;
    }) {
        return [
            "relative px-3 py-2",
            "text-sm font-medium",
            "transition-colors duration-200",
            "rounded-lg",
            isActive
                ? "text-hbt-orange"
                : "text-hbt-dark/75 hover:text-hbt-dark",
        ].join(" ");
    }


    return (
        <header
            className={[
                "fixed inset-x-0 top-0 z-50",
                "transition-all duration-300 ease-out",
                isScrolled
                    ? "px-3 pt-3 sm:px-5"
                    : "px-0 pt-0",
            ].join(" ")}
        >
            <div
                className={[
                    "mx-auto",
                    "transition-all duration-300 ease-out",
                    isScrolled
                        ? [
                            "max-w-7xl",
                            "rounded-2xl",
                            "border border-black/5",
                            "bg-white/80",
                            "shadow-[0_12px_40px_rgba(15,23,42,0.10)]",
                            "backdrop-blur-xl",
                            "supports-[backdrop-filter]:bg-white/70",
                        ].join(" ")
                        : [
                            "w-full",
                            "border-b border-black/5",
                            "bg-white",
                        ].join(" "),
                ].join(" ")}
            >
                <nav
                    className={[
                        "mx-auto flex items-center justify-between",
                        "transition-all duration-300",
                        isScrolled
                            ? "h-[68px] px-4 sm:px-6"
                            : "h-[88px] px-5 sm:px-8 lg:px-10",
                    ].join(" ")}
                    aria-label="Main navigation"
                >

                    {/* =====================================================
                        LOGO
                    ====================================================== */}

                    <Link
                        to="/"
                        className="group flex shrink-0 items-center"
                        aria-label="HBTronics home"
                    >
                        <div
                            className={[
                                "relative overflow-hidden",
                                "transition-all duration-300",
                                isScrolled
                                    ? "h-9 w-[150px]"
                                    : "h-11 w-[175px]",
                            ].join(" ")}
                        >
                            <img
                                src="/src/assets/brand/hbt-logo-full.png"
                                alt="HBTronics"
                                className="h-full w-full object-contain object-left"
                            />
                        </div>
                    </Link>


                    {/* =====================================================
                        DESKTOP NAVIGATION
                    ====================================================== */}

                    <div className="hidden items-center gap-1 lg:flex">
                        {navigation.map(
                            (item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    className={
                                        navLinkClass
                                    }
                                >
                                    {({
                                        isActive,
                                    }) => (
                                        <>
                                            <span>
                                                {
                                                    item.label
                                                }
                                            </span>

                                            <span
                                                className={[
                                                    "absolute bottom-0 left-3 right-3",
                                                    "h-[2px]",
                                                    "rounded-full",
                                                    "bg-hbt-orange",
                                                    "transition-all duration-200",
                                                    isActive
                                                        ? "scale-x-100 opacity-100"
                                                        : "scale-x-0 opacity-0",
                                                ].join(" ")}
                                            />
                                        </>
                                    )}
                                </NavLink>
                            ),
                        )}
                    </div>


                    {/* =====================================================
                        RIGHT SIDE
                    ====================================================== */}

                    <div className="hidden items-center gap-3 lg:flex">

                        {!isAuthenticated ? (
                            <>
                                <Link
                                    to="/login"
                                    className={[
                                        "rounded-xl px-4 py-2.5",
                                        "text-sm font-semibold",
                                        "text-hbt-dark",
                                        "transition-colors",
                                        "hover:bg-hbt-gray",
                                    ].join(" ")}
                                >
                                    Sign in
                                </Link>

                                <Link
                                    to="/register"
                                    className={[
                                        "group inline-flex items-center gap-2",
                                        "rounded-xl",
                                        "bg-hbt-orange",
                                        "px-5 py-2.5",
                                        "text-sm font-semibold",
                                        "text-white",
                                        "shadow-sm",
                                        "transition-all duration-200",
                                        "hover:-translate-y-0.5",
                                        "hover:bg-[#e96916]",
                                        "hover:shadow-lg",
                                    ].join(" ")}
                                >
                                    Get started

                                    <ChevronRight
                                        className={[
                                            "h-4 w-4",
                                            "transition-transform",
                                            "duration-200",
                                            "group-hover:translate-x-0.5",
                                        ].join(" ")}
                                    />
                                </Link>
                            </>
                        ) : (

                            /*
                             * =================================================
                             * AUTHENTICATED USER
                             * =================================================
                             */

                            <div
                                ref={profileRef}
                                className="relative"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsProfileOpen(
                                            (current) =>
                                                !current,
                                        )
                                    }
                                    aria-expanded={
                                        isProfileOpen
                                    }
                                    aria-haspopup="menu"
                                    className={[
                                        "group flex items-center gap-2.5",
                                        "rounded-xl",
                                        "border border-transparent",
                                        "px-2 py-1.5",
                                        "transition-all duration-200",
                                        "hover:border-black/5",
                                        "hover:bg-hbt-gray/70",
                                    ].join(" ")}
                                >

                                    {/* Avatar */}

                                    <div
                                        className={[
                                            "flex shrink-0 items-center justify-center",
                                            "rounded-full",
                                            "bg-hbt-orange",
                                            "font-semibold",
                                            "text-white",
                                            "shadow-sm",
                                            isScrolled
                                                ? "h-8 w-8 text-[11px]"
                                                : "h-9 w-9 text-xs",
                                        ].join(" ")}
                                    >
                                        {initials}
                                    </div>


                                    {/* Name + Role */}

                                    <div className="hidden text-left xl:block">
                                        <p className="max-w-[150px] truncate text-xs font-semibold leading-4 text-hbt-dark">
                                            {
                                                fullName
                                            }
                                        </p>

                                        <p className="text-[10px] font-medium leading-4 text-slate-500">
                                            {role}
                                        </p>
                                    </div>


                                    <ChevronDown
                                        className={[
                                            "h-4 w-4",
                                            "text-slate-500",
                                            "transition-transform duration-200",
                                            isProfileOpen
                                                ? "rotate-180"
                                                : "",
                                        ].join(" ")}
                                    />
                                </button>


                                {/* =========================================
                                    PROFILE DROPDOWN
                                ========================================== */}

                                {isProfileOpen && (
                                    <div
                                        role="menu"
                                        className={[
                                            "absolute right-0 top-[calc(100%+10px)]",
                                            "w-[290px]",
                                            "overflow-hidden",
                                            "rounded-2xl",
                                            "border border-slate-200/80",
                                            "bg-white",
                                            "shadow-[0_20px_50px_rgba(15,23,42,0.14)]",
                                            "animate-in fade-in slide-in-from-top-2",
                                            "duration-200",
                                        ].join(" ")}
                                    >

                                        {/* User information */}

                                        <div className="border-b border-slate-100 px-4 py-4">
                                            <div className="flex items-center gap-3">

                                                <div
                                                    className={[
                                                        "flex h-10 w-10 shrink-0",
                                                        "items-center justify-center",
                                                        "rounded-full",
                                                        "bg-hbt-orange",
                                                        "text-xs font-bold",
                                                        "text-white",
                                                    ].join(" ")}
                                                >
                                                    {
                                                        initials
                                                    }
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-hbt-dark">
                                                        {
                                                            fullName
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                        {
                                                            email
                                                        }
                                                    </p>

                                                    <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-hbt-orange">
                                                        {
                                                            role
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>


                                        {/* Menu */}

                                        <div className="p-2">

                                            <Link
                                                to="/dashboard"
                                                role="menuitem"
                                                onClick={() =>
                                                    setIsProfileOpen(
                                                        false,
                                                    )
                                                }
                                                className={[
                                                    "flex items-center gap-3",
                                                    "rounded-xl px-3 py-2.5",
                                                    "text-sm font-medium",
                                                    "text-hbt-dark",
                                                    "transition-colors",
                                                    "hover:bg-hbt-gray",
                                                ].join(" ")}
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                                                    <LayoutDashboard className="h-4 w-4 text-slate-600" />
                                                </div>

                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">
                                                        Dashboard
                                                    </p>

                                                    <p className="text-[11px] text-slate-500">
                                                        Your learning overview
                                                    </p>
                                                </div>

                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                            </Link>


                                            <Link
                                                to="/settings"
                                                role="menuitem"
                                                onClick={() =>
                                                    setIsProfileOpen(
                                                        false,
                                                    )
                                                }
                                                className={[
                                                    "mt-1 flex items-center gap-3",
                                                    "rounded-xl px-3 py-2.5",
                                                    "text-sm font-medium",
                                                    "text-hbt-dark",
                                                    "transition-colors",
                                                    "hover:bg-hbt-gray",
                                                ].join(" ")}
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                                                    <Settings className="h-4 w-4 text-slate-600" />
                                                </div>

                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">
                                                        Settings
                                                    </p>

                                                    <p className="text-[11px] text-slate-500">
                                                        Manage your account
                                                    </p>
                                                </div>

                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                            </Link>

                                        </div>


                                        {/* Logout */}

                                        <div className="border-t border-slate-100 p-2">

                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() =>
                                                    void handleLogout()
                                                }
                                                className={[
                                                    "flex w-full items-center gap-3",
                                                    "rounded-xl px-3 py-2.5",
                                                    "text-sm font-medium",
                                                    "text-red-600",
                                                    "transition-colors",
                                                    "hover:bg-red-50",
                                                ].join(" ")}
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                                                    <LogOut className="h-4 w-4" />
                                                </div>

                                                <span className="font-semibold">
                                                    Logout
                                                </span>
                                            </button>

                                        </div>

                                    </div>
                                )}
                            </div>
                        )}
                    </div>


                    {/* =====================================================
                        MOBILE MENU BUTTON
                    ====================================================== */}

                    <button
                        type="button"
                        onClick={() =>
                            setIsMenuOpen(
                                (current) =>
                                    !current,
                            )
                        }
                        className={[
                            "flex h-10 w-10 items-center justify-center",
                            "rounded-xl",
                            "border border-slate-200",
                            "bg-white",
                            "text-hbt-dark",
                            "transition-colors",
                            "hover:bg-hbt-gray",
                            "lg:hidden",
                        ].join(" ")}
                        aria-label={
                            isMenuOpen
                                ? "Close menu"
                                : "Open menu"
                        }
                        aria-expanded={
                            isMenuOpen
                        }
                    >
                        {isMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>

                </nav>


                {/* =========================================================
                    MOBILE MENU
                ========================================================== */}

                {isMenuOpen && (
                    <div
                        className={[
                            "border-t border-slate-100",
                            "bg-white",
                            "px-4 pb-5 pt-3",
                            "lg:hidden",
                        ].join(" ")}
                    >

                        <div className="space-y-1">
                            {navigation.map(
                                (item) => (
                                    <NavLink
                                        key={
                                            item.href
                                        }
                                        to={
                                            item.href
                                        }
                                        className={({
                                            isActive,
                                        }) =>
                                            [
                                                "flex items-center justify-between",
                                                "rounded-xl px-4 py-3",
                                                "text-sm font-medium",
                                                "transition-colors",
                                                isActive
                                                    ? "bg-orange-50 text-hbt-orange"
                                                    : "text-hbt-dark hover:bg-hbt-gray",
                                            ].join(" ")
                                        }
                                    >
                                        {item.label}

                                        <ChevronRight className="h-4 w-4 opacity-50" />
                                    </NavLink>
                                ),
                            )}
                        </div>


                        <div className="mt-4 border-t border-slate-100 pt-4">

                            {!isAuthenticated ? (
                                <div className="grid grid-cols-2 gap-2">

                                    <Link
                                        to="/login"
                                        className={[
                                            "flex items-center justify-center",
                                            "rounded-xl border border-slate-200",
                                            "px-4 py-3",
                                            "text-sm font-semibold",
                                            "text-hbt-dark",
                                            "transition-colors",
                                            "hover:bg-hbt-gray",
                                        ].join(" ")}
                                    >
                                        Sign in
                                    </Link>

                                    <Link
                                        to="/register"
                                        className={[
                                            "flex items-center justify-center",
                                            "rounded-xl",
                                            "bg-hbt-orange",
                                            "px-4 py-3",
                                            "text-sm font-semibold",
                                            "text-white",
                                            "transition-colors",
                                            "hover:bg-[#e96916]",
                                        ].join(" ")}
                                    >
                                        Get started
                                    </Link>

                                </div>
                            ) : (

                                <div className="space-y-2">

                                    {/* Mobile user summary */}

                                    <div className="flex items-center gap-3 rounded-xl bg-hbt-gray p-3">

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hbt-orange text-xs font-bold text-white">
                                            {
                                                initials
                                            }
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-hbt-dark">
                                                {
                                                    fullName
                                                }
                                            </p>

                                            <p className="truncate text-xs text-slate-500">
                                                {
                                                    email
                                                }
                                            </p>

                                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-hbt-orange">
                                                {
                                                    role
                                                }
                                            </p>
                                        </div>

                                    </div>


                                    <Link
                                        to="/dashboard"
                                        className={[
                                            "flex items-center gap-3",
                                            "rounded-xl px-3 py-3",
                                            "text-sm font-semibold",
                                            "text-hbt-dark",
                                            "hover:bg-hbt-gray",
                                        ].join(" ")}
                                    >
                                        <UserCircle className="h-5 w-5 text-slate-500" />
                                        Dashboard
                                    </Link>


                                    <Link
                                        to="/settings"
                                        className={[
                                            "flex items-center gap-3",
                                            "rounded-xl px-3 py-3",
                                            "text-sm font-semibold",
                                            "text-hbt-dark",
                                            "hover:bg-hbt-gray",
                                        ].join(" ")}
                                    >
                                        <Settings className="h-5 w-5 text-slate-500" />
                                        Settings
                                    </Link>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleLogout()
                                        }
                                        className={[
                                            "flex w-full items-center gap-3",
                                            "rounded-xl px-3 py-3",
                                            "text-sm font-semibold",
                                            "text-red-600",
                                            "hover:bg-red-50",
                                        ].join(" ")}
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Logout
                                    </button>

                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}