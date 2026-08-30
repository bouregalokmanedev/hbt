
import {
    BrainCircuit,
    Check,
    ChevronRight,
    Circle,
    Cpu,
    Gauge,
    MessageSquare,
    Radio,
    Sparkles,
    UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

const STREAMING_MESSAGE =
    "Based on your Level 02 training, let's start with the fuel-pressure data under load. Before replacing any parts, compare the pressure at idle with the pressure during acceleration. This will help us narrow down the cause.";

const INITIAL_VISIBLE_LENGTH = 0;

const capabilities = [
    {
        number: "01",
        title: "UNDERSTANDS",
        description:
            "Reads the lesson, course and diagnostic context before responding.",
    },
    {
        number: "02",
        title: "ADAPTS",
        description:
            "Adjusts explanations and questions to your level and progress.",
    },
    {
        number: "03",
        title: "GUIDES",
        description:
            "Helps you reason through problems instead of simply giving the answer.",
    },
];

export function AIMentor() {
    const [visibleLength, setVisibleLength] = useState(
        INITIAL_VISIBLE_LENGTH,
    );

    useEffect(() => {
        let index = 0;

        const interval = window.setInterval(() => {
            index += 1;

            setVisibleLength(index);

            if (index >= STREAMING_MESSAGE.length) {
                window.clearInterval(interval);
            }
        }, 22);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    return (
        <section
            id="ai-mentor"
            className="relative overflow-hidden bg-[#191919] text-white"
        >
            {/* =========================================================
                BACKGROUND GRID
            ========================================================== */}

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.055]"
                style={{
                    backgroundImage: `
                        linear-gradient(
                            rgba(255,255,255,0.8) 1px,
                            transparent 1px
                        ),
                        linear-gradient(
                            90deg,
                            rgba(255,255,255,0.8) 1px,
                            transparent 1px
                        )
                    `,
                    backgroundSize: "68px 68px",
                }}
            />

            {/* Large decorative background text */}
            <div className="pointer-events-none absolute -bottom-28 right-[-2%] select-none text-[22rem] font-black leading-none tracking-[-0.12em] text-white/[0.025]">
                AI
            </div>

            <div className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-10">
                {/* =====================================================
                    TOP LABEL
                ====================================================== */}

                <div className="flex h-16 items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#F47822]" />

                        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white">
                            The AI Mentor
                        </span>
                    </div>

                    <span className="font-mono text-[10px] tracking-[0.2em] text-white/30">
                        05 / 05
                    </span>
                </div>

                {/* =====================================================
                    HERO
                ====================================================== */}

                <div className="grid min-h-[760px] items-center gap-16 py-20 lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-20">
                    {/* LEFT */}
                    <div className="relative">
                        <p className="mb-8 text-[11px] font-bold uppercase tracking-[0.34em] text-[#F47822]">
                            Intelligent learning / adaptive mentoring
                        </p>

                        <h2 className="max-w-[850px] text-[clamp(4rem,8vw,8.5rem)] font-black leading-[0.82] tracking-[-0.065em]">
                            YOUR
                            <br />
                            PERSONAL
                            <br />
                            DIAGNOSTIC
                            <br />
                            <span className="text-[#F47822]">
                                MENTOR.
                            </span>
                        </h2>

                        <div className="mt-12 grid max-w-2xl grid-cols-[auto_1fr] gap-5">
                            <div className="mt-1 h-12 w-px bg-[#F47822]" />

                            <div>
                                <p className="max-w-xl text-base leading-7 text-white/60 sm:text-lg">
                                    An AI mentor that understands what
                                    you're learning, where you are in
                                    the course, and how you learn best.
                                </p>

                                <p className="mt-5 max-w-xl text-sm leading-6 text-white/35">
                                    It adapts its explanations, asks the
                                    right questions, uses your course
                                    content, and guides you through
                                    diagnostic reasoning.
                                </p>
                            </div>
                        </div>

                        {/* Technical pipeline */}
                        <div className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                            <span>PROMPT</span>
                            <ChevronRight className="h-3 w-3 text-[#F47822]" />

                            <span>CONTEXT</span>
                            <ChevronRight className="h-3 w-3 text-[#F47822]" />

                            <span>ADAPT</span>
                            <ChevronRight className="h-3 w-3 text-[#F47822]" />

                            <span>TEACH</span>
                            <ChevronRight className="h-3 w-3 text-[#F47822]" />

                            <span>FEEDBACK</span>
                        </div>
                    </div>

                    {/* RIGHT — AI PREVIEW */}
                    <div className="relative">
                        {/* Orange offset frame */}
                        <div className="absolute -bottom-3 -left-3 h-full w-full border border-[#F47822]/50" />

                        <div className="relative overflow-hidden border border-white/15 bg-[#111111]">
                            {/* Window header */}
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center border border-[#F47822]/30 bg-[#F47822]/10">
                                        <BrainCircuit className="h-4 w-4 text-[#F47822]" />
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
                                            AI Mentor
                                        </p>

                                        <p className="mt-0.5 text-xs font-semibold text-white">
                                            Diagnostic mode
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F47822] opacity-60" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F47822]" />
                                    </span>

                                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                                        Live
                                    </span>
                                </div>
                            </div>

                            {/* Context indicators */}
                            <div className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-4">
                                <MentorStatus
                                    icon={<MessageSquare />}
                                    label="Lesson"
                                    value="Connected"
                                />

                                <MentorStatus
                                    icon={<Gauge />}
                                    label="Level"
                                    value="02"
                                />

                                <MentorStatus
                                    icon={<Cpu />}
                                    label="Knowledge"
                                    value="Active"
                                />

                                <MentorStatus
                                    icon={<Radio />}
                                    label="Mode"
                                    value="Reasoning"
                                />
                            </div>

                            {/* Conversation */}
                            <div className="min-h-[430px] p-5 sm:p-6">
                                {/* Student */}
                                <div className="mb-7 flex gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/10 bg-white/[0.04]">
                                        <UserRound className="h-3.5 w-3.5 text-white/50" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                                                Student
                                            </span>

                                            <span className="font-mono text-[8px] text-white/20">
                                                19:42:08
                                            </span>
                                        </div>

                                        <p className="text-sm leading-6 text-white/75">
                                            The engine hesitates when
                                            accelerating. What should I
                                            check first?
                                        </p>
                                    </div>
                                </div>

                                {/* AI */}
                                <div className="flex gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#F47822]">
                                        <Sparkles className="h-3.5 w-3.5 text-white" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                                                AI Mentor
                                            </span>

                                            <span className="font-mono text-[8px] text-white/20">
                                                STREAMING
                                            </span>
                                        </div>

                                        <p className="text-sm leading-7 text-white/80">
                                            {STREAMING_MESSAGE.slice(
                                                0,
                                                visibleLength,
                                            )}

                                            <span className="ml-1 inline-block h-4 w-[2px] translate-y-1 animate-pulse bg-[#F47822]" />
                                        </p>

                                        {/* Reasoning hint */}
                                        <div className="mt-6 border-l border-[#F47822]/50 pl-4">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                                                Mentor approach
                                            </p>

                                            <p className="mt-2 text-xs leading-5 text-white/40">
                                                Guide the student toward
                                                the evidence before
                                                revealing the diagnosis.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <Check className="h-3 w-3 text-[#F47822]" />

                                    <span className="text-[9px] uppercase tracking-[0.15em] text-white/30">
                                        Course context loaded
                                    </span>
                                </div>

                                <span className="font-mono text-[9px] text-white/20">
                                    HBT-AI / 02
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CAPABILITIES
                ====================================================== */}

                <div className="border-t border-white/10">
                    <div className="grid lg:grid-cols-3">
                        {capabilities.map((item, index) => (
                            <div
                                key={item.number}
                                className={`
                                    relative min-h-[220px] py-10 lg:px-8
                                    ${
                                        index !== 0
                                            ? "border-t border-white/10 lg:border-l lg:border-t-0"
                                            : ""
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#F47822]">
                                        {item.number}
                                    </span>

                                    <Circle className="h-3 w-3 fill-white/10 text-white/20" />
                                </div>

                                <h3 className="mt-10 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
                                    {item.title}
                                </h3>

                                <p className="mt-4 max-w-sm text-sm leading-6 text-white/35">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* =====================================================
                    BOTTOM CTA
                ====================================================== */}

                <div className="flex flex-col gap-6 border-t border-white/10 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] uppercase tracking-[0.25em] text-white/25">
                            Learn
                        </span>

                        <ChevronRight className="h-3 w-3 text-[#F47822]" />

                        <span className="text-[9px] uppercase tracking-[0.25em] text-white/25">
                            Practice
                        </span>

                        <ChevronRight className="h-3 w-3 text-[#F47822]" />

                        <span className="text-[9px] uppercase tracking-[0.25em] text-white/25">
                            Diagnose
                        </span>

                        <ChevronRight className="h-3 w-3 text-[#F47822]" />

                        <span className="text-[9px] uppercase tracking-[0.25em] text-white/50">
                            Adapt
                        </span>
                    </div>

                    <button
                        type="button"
                        className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:text-[#F47822]"
                    >
                        Meet your AI mentor

                        <span className="flex h-7 w-7 items-center justify-center border border-white/15 transition-all group-hover:border-[#F47822] group-hover:bg-[#F47822]">
                            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
}

interface MentorStatusProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function MentorStatus({
    icon,
    label,
    value,
}: MentorStatusProps) {
    return (
        <div className="border-r border-white/10 px-4 py-3 last:border-r-0">
            <div className="flex items-center gap-2">
                <span className="text-[#F47822] [&>svg]:h-3 [&>svg]:w-3">
                    {icon}
                </span>

                <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/30">
                    {label}
                </span>
            </div>

            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/60">
                {value}
            </p>
        </div>
    );
}