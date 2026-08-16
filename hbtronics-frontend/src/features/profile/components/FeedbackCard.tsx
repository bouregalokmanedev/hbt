import {
    ArrowRight,
    MessageSquarePlus,
    Sparkles,
} from "lucide-react";

export function FeedbackCard() {
    return (
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">

            <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3A3A3A]/5">
                    <MessageSquarePlus className="h-4 w-4 text-[#3A3A3A]/55" />
                </div>

                <div className="min-w-0">

                    <p className="text-sm font-semibold text-[#3A3A3A]">
                        Help us improve
                    </p>

                    <p className="mt-0.5 text-[10px] leading-4 text-[#3A3A3A]/40">
                        Your feedback helps us build a better learning experience.
                    </p>

                </div>

            </div>

            <div className="mt-4 rounded-xl border border-[#F47822]/10 bg-[#F47822]/5 p-3">

                <div className="flex items-start gap-2.5">

                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />

                    <p className="text-[10px] leading-4 text-[#3A3A3A]/55">
                        Tell us what you like, what could be better,
                        or what you'd like to see next.
                    </p>

                </div>

            </div>

            <button
                type="button"
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#3A3A3A]/8 px-4 py-2.5 text-left transition hover:border-[#F47822]/25 hover:bg-[#F47822]/5"
            >
                <span className="text-xs font-semibold text-[#3A3A3A]">
                    Send feedback
                </span>

                <ArrowRight className="h-3.5 w-3.5 text-[#3A3A3A]/35" />
            </button>

        </section>
    );
}