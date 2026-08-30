import {
    ArrowUpRight,
    BookOpenCheck,
    Flame,
    Sparkles,
    Target,
} from "lucide-react";

function DailyChallengesCard() {
    return (
        <section className="group relative min-h-[230px] overflow-hidden rounded-3xl bg-[#3A3A3A] p-6 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(58,58,58,0.18)] sm:p-7">
            {/* Background decoration */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F47822]/20 blur-3xl transition-transform duration-500 group-hover:scale-125" />

            <div className="absolute bottom-[-80px] left-[-40px] h-40 w-40 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F47822] shadow-[0_8px_25px_rgba(244,120,34,0.28)]">
                        <Flame className="h-5 w-5 text-white" />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all group-hover:border-[#F47822]/40 group-hover:bg-[#F47822]/10 group-hover:text-[#F47822]">
                        <ArrowUpRight className="h-4 w-4" />
                    </div>
                </div>

                <div className="mt-auto pt-8">
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F47822]">
                            Daily Practice
                        </p>

                        <span className="h-1 w-1 rounded-full bg-white/30" />

                        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                            Coming soon
                        </span>
                    </div>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                        Daily Challenges
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-white/55">
                        Sharpen your diagnostic thinking with a new
                        automotive challenge every day.
                    </p>

                    <div className="mt-5 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-white/40">
                            <Target className="h-3.5 w-3.5" />

                            <span>
                                1 challenge every day
                            </span>
                        </div>

                        <div className="h-1 w-1 rounded-full bg-white/20" />

                        <div className="flex items-center gap-2 text-xs text-white/40">
                            <Sparkles className="h-3.5 w-3.5" />

                            <span>
                                Earn XP
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function HomeworkCard() {
    return (
        <section className="group relative min-h-[230px] overflow-hidden rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_10px_35px_rgba(58,58,58,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(58,58,58,0.1)] sm:p-7">
            {/* Decorative gradient */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F47822]/8 blur-3xl transition-transform duration-500 group-hover:scale-125" />

            <div className="absolute right-8 top-8 opacity-[0.035]">
                <BookOpenCheck className="h-32 w-32" />
            </div>

            <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                        <BookOpenCheck className="h-5 w-5" />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A3A3A]/8 bg-[#F7F7F7] text-[#3A3A3A]/35 transition-all group-hover:border-[#F47822]/20 group-hover:bg-[#F47822]/5 group-hover:text-[#F47822]">
                        <ArrowUpRight className="h-4 w-4" />
                    </div>
                </div>

                <div className="mt-auto pt-8">
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F47822]">
                            Course Practice
                        </p>

                        <span className="h-1 w-1 rounded-full bg-[#3A3A3A]/20" />

                        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#3A3A3A]/30">
                            Coming soon
                        </span>
                    </div>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#3A3A3A]">
                        Homework
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50">
                        Reinforce what you learn with practical assignments
                        connected to your courses.
                    </p>

                    <div className="mt-5 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-[#3A3A3A]/40">
                            <BookOpenCheck className="h-3.5 w-3.5" />

                            <span>
                                Course assignments
                            </span>
                        </div>

                        <div className="h-1 w-1 rounded-full bg-[#3A3A3A]/15" />

                        <div className="flex items-center gap-2 text-xs text-[#3A3A3A]/40">
                            <Sparkles className="h-3.5 w-3.5" />

                            <span>
                                Build your skills
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function ComingSoonCards() {
    return (
        <section>
            <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                        Keep learning
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-[#3A3A3A]">
                        More ways to learn
                    </h2>
                </div>

                <span className="hidden text-xs text-[#3A3A3A]/35 sm:block">
                    New learning experiences are on the way
                </span>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <DailyChallengesCard />
                <HomeworkCard />
            </div>
        </section>
    );
}