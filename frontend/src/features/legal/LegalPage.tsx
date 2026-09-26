import { Link, useParams } from "react-router-dom";

const CONTENT: Record<string, { title: string; updated: string; body: string[] }> = {
    privacy: {
        title: "Privacy Policy",
        updated: "Last updated 2026",
        body: [
            "HBTronics collects only the data needed to run your learning account: profile details, enrollments, progress, and support messages.",
            "We never sell your personal data. Analytics are aggregated and used to improve courses and diagnostics.",
            "Contact support@hbtronics.dz to request export or deletion of your data.",
        ],
    },
    terms: {
        title: "Terms of Service",
        updated: "Last updated 2026",
        body: [
            "Courses, simulators, and certificates are for your personal learning. Do not share accounts or redistribute paid content.",
            "Paid orders are confirmed via webhook before enrollment unlocks. Refunds follow the policy shown at checkout.",
            "Misuse, fraud, or abuse may lead to suspension under our admin review process.",
        ],
    },
    cookies: {
        title: "Cookie Policy",
        updated: "Last updated 2026",
        body: [
            "We use strictly-necessary cookies for auth (hbtronics_access_token), language (hbt-language), and security.",
            "No third-party advertising trackers are set by the learning platform itself. Embedded maps or videos may set their own cookies.",
            "Clearing cookies will sign you out; your progress stays saved on your account.",
        ],
    },
};

export function LegalPage({ page }: { page?: keyof typeof CONTENT }) {
    const params = useParams<{ page?: string }>();
    const key = (page ?? params.page ?? "privacy") as keyof typeof CONTENT;
    const doc = CONTENT[key] ?? CONTENT.privacy;
    return (
        <main className="mx-auto max-w-3xl px-5 py-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-hbt-orange">{doc.updated}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-hbt-dark">{doc.title}</h1>
            <div className="mt-6 space-y-4">
                {doc.body.map((p) => (
                    <p key={p} className="text-sm leading-7 text-slate-600">{p}</p>
                ))}
            </div>
            <div className="mt-8 flex gap-4 text-sm font-semibold">
                <Link to="/contact" className="text-hbt-orange hover:underline">Contact us</Link>
                <Link to="/catalog" className="text-hbt-dark hover:underline">Explore courses</Link>
            </div>
        </main>
    );
}
