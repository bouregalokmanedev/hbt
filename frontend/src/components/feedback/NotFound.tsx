import { Link } from "react-router-dom";

import { Button } from "@/components/ui";

export function NotFound() {
    return (
        <main className="grid min-h-screen place-items-center px-6">
            <div className="text-center">
                <p className="text-6xl font-bold text-[var(--primary)]">
                    404
                </p>

                <h1 className="mt-4 text-2xl font-semibold">
                    Page not found
                </h1>

                <p className="mt-2 text-[var(--muted)]">
                    The page you're looking for doesn't exist.
                </p>

                <Button className="mt-6">
                    <Link to="/">
                        Back home
                    </Link>
                </Button>
            </div>
        </main>
    );
}