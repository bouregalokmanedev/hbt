import { Link } from "react-router-dom";

import { Button, Container } from "@/components/ui";

import { Logo } from "./Logo";

export function Navbar() {
    return (
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
            <Container className="flex h-16 items-center justify-between">
                <Logo />

                <nav
                    aria-label="Public navigation"
                    className="hidden items-center gap-6 md:flex"
                >
                    <Link
                        to="/courses"
                        className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                    >
                        Courses
                    </Link>

                    <Link
                        to="/about"
                        className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                    >
                        About
                    </Link>

                    <Link
                        to="/contact"
                        className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                    >
                        Contact
                    </Link>
                </nav>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                    >
                        <Link to="/login">
                            Sign in
                        </Link>
                    </Button>

                    <Button size="sm">
                        <Link to="/register">
                            Get started
                        </Link>
                    </Button>
                </div>
            </Container>
        </header>
    );
}