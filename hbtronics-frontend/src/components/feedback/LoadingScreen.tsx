import { Spinner } from "@/components/ui";

export function LoadingScreen() {
    return (
        <div
            className="grid min-h-screen place-items-center bg-[var(--background)]"
            role="status"
        >
            <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />

                <p className="text-sm text-[var(--muted)]">
                    Loading...
                </p>
            </div>
        </div>
    );
}