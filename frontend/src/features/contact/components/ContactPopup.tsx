import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useEffect } from "react";

export type ContactPopupState =
    | { kind: "success" }
    | { kind: "error"; message: string }
    | null;

interface ContactPopupProps {
    state: ContactPopupState;
    onClose: () => void;
}

export function ContactPopup({ state, onClose }: ContactPopupProps) {
    useEffect(() => {
        if (!state) return;

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [state, onClose]);

    if (!state) return null;

    const isSuccess = state.kind === "success";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-hbt-dark/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-popup-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className={`h-1.5 w-full ${isSuccess ? "bg-hbt-orange" : "bg-red-500"}`} />
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-x-0 top-1.5 h-28 bg-gradient-to-b ${
                        isSuccess ? "from-hbt-orange/10 to-transparent" : "from-red-500/10 to-transparent"
                    }`}
                />

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close notification"
                    className="absolute end-4 top-4 rounded-lg p-1.5 text-hbt-dark/45 transition hover:bg-slate-100 hover:text-hbt-dark"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="relative px-7 pb-7 pt-8 text-center">
                    <div
                        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${
                            isSuccess
                                ? "bg-hbt-orange text-white shadow-[0_10px_28px_rgba(244,120,34,.35)]"
                                : "bg-red-500 text-white shadow-[0_10px_28px_rgba(239,68,68,.3)]"
                        }`}
                    >
                        {isSuccess ? <CheckCircle2 className="h-8 w-8" /> : <CircleAlert className="h-8 w-8" />}
                    </div>

                    <p className={`mt-5 text-[10px] font-bold uppercase tracking-[0.2em] ${isSuccess ? "text-hbt-orange" : "text-red-500"}`}>
                        {isSuccess ? "Message sent" : "Message not sent"}
                    </p>
                    <h2 id="contact-popup-title" className="mt-2 text-xl font-bold leading-snug text-hbt-dark">
                        {isSuccess
                            ? "Thanks — your message is on its way to our team."
                            : "We couldn't send your message."}
                    </h2>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-hbt-dark/60">
                        {isSuccess
                            ? "We've received your inquiry and emailed it to support@hbtronics.dz. Expect a reply soon."
                            : state.message}
                    </p>

                    <button
                        type="button"
                        onClick={onClose}
                        className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition ${
                            isSuccess
                                ? "bg-hbt-orange shadow-[0_8px_20px_rgba(244,120,34,.25)] hover:bg-[#e96916]"
                                : "bg-hbt-dark hover:bg-black"
                        }`}
                    >
                        {isSuccess ? "Done" : "Try again"}
                    </button>

                    <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-hbt-dark/35">
                        HBT · Support inbox
                    </p>
                </div>
            </section>
        </div>
    );
}
