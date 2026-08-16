
import {
    BookOpen,
    Clock3,
    GraduationCap,
    Trophy,
} from "lucide-react";

export function LearningOverview() {
    return (
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)] sm:p-6">

            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                    Learning
                </p>

                <h2 className="mt-1 text-base font-semibold text-[#3A3A3A]">
                    Learning overview
                </h2>

                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45">
                    A quick look at your learning journey.
                </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">

                <Stat
                    icon={BookOpen}
                    label="Active courses"
                    value="—"
                />

                <Stat
                    icon={GraduationCap}
                    label="Completed"
                    value="—"
                />

                <Stat
                    icon={Clock3}
                    label="Learning hours"
                    value="—"
                />

                <Stat
                    icon={Trophy}
                    label="Certificates"
                    value="—"
                />

            </div>

            <div className="mt-5 rounded-xl bg-[#F7F7F7] p-4">

                <div className="flex items-center justify-between">

                    <div>
                        <p className="text-xs font-semibold text-[#3A3A3A]">
                            Overall progress
                        </p>

                        <p className="mt-1 text-[10px] text-[#3A3A3A]/40">
                            Keep learning to improve your progress.
                        </p>
                    </div>

                    <span className="text-sm font-bold text-[#F47822]">
                        —
                    </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                    <div className="h-full w-0 rounded-full bg-[#F47822]" />
                </div>

            </div>

        </section>
    );
}

interface StatProps {
    icon: typeof BookOpen;
    label: string;
    value: string;
}

function Stat({
    icon: Icon,
    label,
    value,
}: StatProps) {
    return (
        <div className="rounded-xl border border-[#3A3A3A]/6 bg-[#FAFAFA] p-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47822]/10 text-[#F47822]">
                <Icon className="h-3.5 w-3.5" />
            </div>

            <p className="mt-3 text-lg font-bold text-[#3A3A3A]">
                {value}
            </p>

            <p className="mt-0.5 text-[10px] text-[#3A3A3A]/40">
                {label}
            </p>

        </div>
    );
}
