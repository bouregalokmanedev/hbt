import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { usePageMeta } from "@/lib/page-meta";

export function NotFound() {
    const { t } = useTranslation();

    usePageMeta({
        title: t("errors.notFoundTitle"),
        description: t("errors.notFoundBody"),
        noIndex: true,
    });

    return (
        <main className="grid min-h-screen place-items-center px-6">
            <div className="text-center">
                <p className="text-6xl font-bold text-[var(--primary)]">
                    404
                </p>

                <h1 className="mt-4 text-2xl font-semibold">
                    {t("errors.notFoundTitle")}
                </h1>

                <p className="mt-2 text-[var(--muted)]">
                    {t("errors.notFoundBody")}
                </p>

                <Button className="mt-6">
                    <Link to="/">
                        {t("errors.backHome")}
                    </Link>
                </Button>
            </div>
        </main>
    );
}