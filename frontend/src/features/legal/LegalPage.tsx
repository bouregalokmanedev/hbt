import { Link, useParams } from "react-router-dom";

import { useTranslation } from "react-i18next";

type LegalDoc = "privacy" | "terms" | "cookies";

const DOC_KEYS: LegalDoc[] = ["privacy", "terms", "cookies"];

export function LegalPage({ page }: { page?: LegalDoc }) {
    const params = useParams<{ page?: string }>();
    const { t } = useTranslation();

    const requested = (page ?? params.page) as LegalDoc | undefined;
    const key: LegalDoc = DOC_KEYS.includes(requested as LegalDoc)
        ? (requested as LegalDoc)
        : "privacy";

    const title = t(`legal.${key}.title`);
    const updated = t(`legal.${key}.updated`);
    const body = t(`legal.${key}.body`, { returnObjects: true }) as string[];

    return (
        <main className="mx-auto max-w-3xl px-5 py-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-hbt-orange">{updated}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-hbt-dark">{title}</h1>
            <div className="mt-6 space-y-4">
                {(Array.isArray(body) ? body : []).map((p) => (
                    <p key={p} className="text-sm leading-7 text-slate-600">{p}</p>
                ))}
            </div>
            <div className="mt-8 flex gap-4 text-sm font-semibold">
                <Link to="/contact" className="text-hbt-orange hover:underline">{t("pricing.plans.contactUs")}</Link>
                <Link to="/catalog" className="text-hbt-dark hover:underline">{t("common.exploreCourses")}</Link>
            </div>
        </main>
    );
}
