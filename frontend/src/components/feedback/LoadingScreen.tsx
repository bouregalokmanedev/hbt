import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui";

export function LoadingScreen() {
    const { t } = useTranslation();

    return (
        <div
            className="grid min-h-screen place-items-center bg-[var(--background)]"
            role="status"
        >
            <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />

                <p className="text-sm text-[var(--muted)]">
                    {t("common.loading")}
                </p>
            </div>
        </div>
    );
}