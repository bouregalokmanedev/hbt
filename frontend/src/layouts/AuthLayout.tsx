import {
    Outlet,
} from "react-router-dom";

import { Logo } from "@/components/navigation";

export function AuthLayout() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="flex min-h-screen">
                <div className="hidden w-1/2 bg-[var(--foreground)] p-10 lg:flex lg:flex-col">
                    <Logo />

                    <div className="mt-auto max-w-lg">
                        <p className="text-sm font-medium text-white/60">
                            HBTronics Learning Platform
                        </p>

                        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                            Master automotive
                            diagnostics.
                        </h1>

                        <p className="mt-4 text-white/60">
                            Build practical diagnostic
                            skills through structured
                            technical training.
                        </p>
                    </div>
                </div>

                <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8 lg:hidden">
                            <Logo />
                        </div>

                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}