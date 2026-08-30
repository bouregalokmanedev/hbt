import type {
    ReactNode,
} from "react";

interface AuthCardProps {
    children: ReactNode;
}

export function AuthCard({
    children,
}: AuthCardProps) {
    return (
        <div className="w-full">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                {children}
            </div>
        </div>
    );
}