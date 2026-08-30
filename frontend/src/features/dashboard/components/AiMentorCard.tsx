import {
    ArrowRight,
    Bot,
    Sparkles,
} from "lucide-react";

import type {
    AIMentor,
} from "../types/dashboard.types";
import { Link } from "react-router-dom";

interface AiMentorCardProps {
    mentor: AIMentor;
}

export function AiMentorCard({
    mentor,
}: AiMentorCardProps) {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-[#3A3A3A] p-5 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)] sm:p-6">
            {/* Background glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#F47822]/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-20 h-40 w-40 rounded-full bg-[#F47822]/10 blur-3xl" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822] shadow-[0_8px_20px_rgba(244,120,34,0.22)]">
                            <Bot className="h-5 w-5 text-white" />
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                                AI Learning
                            </p>

                            <h2 className="mt-0.5 text-base font-semibold text-white">
                                AI Mentor
                            </h2>
                        </div>
                    </div>

                    {mentor.available && (
                        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                            <span className="text-[10px] font-medium text-white/55">
                                Available
                            </span>
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div className="mt-6 max-w-xl">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#F47822]" />

                        <h3 className="text-lg font-semibold text-white">
                            {mentor.title}
                        </h3>
                    </div>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">
                        {mentor.description}
                    </p>
                </div>

                {/* Recommendation */}
                {mentor.recommendation?.title && (
                    <div className="mt-5 rounded-xl border border-white/8 bg-white/5 p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                            Recommended for you
                        </p>

                        <p className="mt-1.5 text-sm font-medium text-white/85">
                            {mentor.recommendation.title}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-5 flex flex-col gap-4 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                            Queries remaining
                        </p>

                        <p className="mt-1 text-lg font-semibold text-white">
                            {mentor.queries_remaining}
                        </p>
                    </div>

                    <Link
                        to="/ai-mentor"
                        aria-disabled={!mentor.available}
                        className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(244,120,34,0.18)] transition-all duration-200 hover:bg-[#e96d18] hover:shadow-[0_10px_25px_rgba(244,120,34,0.24)] ${mentor.available ? "" : "pointer-events-none cursor-not-allowed opacity-40"}`}
                    >
                        Ask AI Mentor

                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
