import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    CircleCheck,
    Clock3,
    LifeBuoy,
    MessageSquareText,
    Search,
    Ticket,
} from "lucide-react";

import { supportApi, type SupportTicket } from "@/features/support/api/support.api";

type TrackState =
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "found"; ticket: SupportTicket };

export function TicketTrackPage() {
    const { t } = useTranslation();

    const [reference, setReference] = useState("");
    const [email, setEmail] = useState("");
    const [state, setState] = useState<TrackState>({ kind: "idle" });

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (state.kind === "loading") return;
        setState({ kind: "loading" });
        try {
            const ticket = await supportApi.track(reference.trim(), email.trim());
            setState({ kind: "found", ticket });
        } catch (cause) {
            setState({
                kind: "error",
                message: cause instanceof Error ? cause.message : t("help.track.notFound"),
            });
        }
    };

    return (
        <div className="bg-white">
            <section className="border-b border-[#3A3A3A]/8 bg-gradient-to-b from-[#FFF8F4] to-white">
                <div className="mx-auto max-w-2xl px-5 py-14 text-center">
                    <Link
                        to="/help"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]/50 transition hover:text-[#F47822]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                        {t("help.backToHelp")}
                    </Link>
                    <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                        {t("help.track.eyebrow")}
                    </p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-[#3A3A3A]">
                        {t("help.track.title")}
                    </h1>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#3A3A3A]/60">
                        {t("help.track.subtitle")}
                    </p>

                    <form
                        onSubmit={(event) => void submit(event)}
                        className="mx-auto mt-8 max-w-md space-y-3 rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 text-start shadow-sm"
                    >
                        <label className="block">
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/45">
                                {t("help.track.reference")}
                            </span>
                            <input
                                value={reference}
                                onChange={(event) => setReference(event.target.value)}
                                required
                                placeholder={t("help.track.referencePh")}
                                className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-sm outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10"
                            />
                        </label>
                        <label className="block">
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/45">
                                {t("help.track.email")}
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                placeholder={t("help.track.emailPh")}
                                className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-sm outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={state.kind === "loading"}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-sm font-bold text-white transition hover:bg-[#E96D18] disabled:opacity-60"
                        >
                            <Search className="h-4 w-4" />
                            {state.kind === "loading"
                                ? t("help.track.searching")
                                : t("help.track.submit")}
                        </button>
                        {state.kind === "error" && (
                            <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600">
                                {state.message}
                            </p>
                        )}
                    </form>
                </div>
            </section>

            <section className="mx-auto max-w-2xl px-5 py-12">
                {state.kind === "found" && <TrackResult ticket={state.ticket} />}

                {state.kind !== "found" && (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <TrackHint
                            icon={<Ticket className="h-4 w-4 text-[#F47822]" />}
                            title={t("help.track.hintRef.title")}
                            body={t("help.track.hintRef.body")}
                        />
                        <TrackHint
                            icon={<Clock3 className="h-4 w-4 text-[#F47822]" />}
                            title={t("help.track.hintSla.title")}
                            body={t("help.track.hintSla.body")}
                        />
                        <TrackHint
                            icon={<LifeBuoy className="h-4 w-4 text-[#F47822]" />}
                            title={t("help.track.hintNoAccount.title")}
                            body={t("help.track.hintNoAccount.body")}
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

function TrackResult({ ticket }: { ticket: SupportTicket }) {
    const { t } = useTranslation();

    const dotColors: Record<string, string> = {
        open: "bg-emerald-500",
        pending: "bg-amber-500",
        resolved: "bg-sky-500",
        closed: "bg-slate-400",
    };

    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        {t("help.track.found")}
                    </p>
                    <h2 className="mt-2 text-lg font-black text-[#3A3A3A]">{ticket.subject}</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/10 px-3 py-1.5 text-[11px] font-bold text-[#3A3A3A]">
                    <span className={`h-2 w-2 rounded-full ${dotColors[ticket.status] ?? dotColors.closed}`} />
                    {ticket.status}
                </span>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <TrackField label={t("help.track.reference")} value={ticket.id.slice(0, 8)} />
                <TrackField label={t("help.track.category")} value={ticket.category} />
                <TrackField label={t("help.track.priority")} value={ticket.priority} />
                <TrackField label={t("help.track.replies")} value={String(ticket.replies_count)} />
                <TrackField
                    label={t("help.track.opened")}
                    value={ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "—"}
                />
                <TrackField
                    label={t("help.track.updated")}
                    value={ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : "—"}
                />
            </dl>

            {(ticket.status === "resolved" || ticket.status === "closed") && (
                <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                    <CircleCheck className="h-4 w-4" />
                    {t("help.track.closedNote")}
                </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-[#3A3A3A]/8 pt-5">
                <Link
                    to="/help"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 px-4 py-2.5 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    {t("help.backToHelp")}
                </Link>
                <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#E96D18]"
                >
                    <MessageSquareText className="h-4 w-4" />
                    {t("help.contactCta")}
                </Link>
            </div>
        </div>
    );
}

function TrackField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-bold text-[#3A3A3A]">{value}</dd>
        </div>
    );
}

function TrackHint({
    icon,
    title,
    body,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
}) {
    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5">
            <div className="flex items-center gap-2">
                {icon}
                <p className="text-xs font-bold text-[#3A3A3A]">{title}</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#3A3A3A]/55">{body}</p>
        </div>
    );
}
