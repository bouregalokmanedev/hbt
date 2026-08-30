import {
    ArrowLeft,
    BookOpen,
} from "lucide-react";

import type {
    Lesson,
} from "../types/lesson.types";

interface LearningHeaderProps {
    lesson: Lesson;
    onBack: () => void;
}

export function LessonHeader({
    lesson,
    onBack,
}: LearningHeaderProps) {
    return (
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 shadow-[0_2px_12px_rgba(15,23,42,0.04)] backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
                {/* =====================================================
                    BACK BUTTON
                ====================================================== */}

                <button
                    type="button"
                    onClick={onBack}
                    className="
                        group
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        rounded-xl
                        border border-border
                        bg-card
                        text-muted-foreground
                        shadow-sm
                        transition-all duration-200
                        hover:-translate-x-0.5
                        hover:border-[#F47822]/30
                        hover:bg-[#F47822]/5
                        hover:text-[#F47822]
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[#F47822]/40
                        focus-visible:ring-offset-2
                    "
                    aria-label="Back to course"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                </button>

                {/* Divider */}
                <div className="hidden h-7 w-px bg-border sm:block" />

                {/* =====================================================
                    LESSON ICON
                ====================================================== */}

                <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822] sm:flex">
                    <BookOpen className="h-4 w-4" />
                </div>

                {/* =====================================================
                    LESSON INFORMATION
                ====================================================== */}

                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        Learning
                    </p>

                    <h1 className="truncate text-sm font-bold leading-5 tracking-tight text-foreground">
                        {lesson.title}
                    </h1>
                </div>

                {/* =====================================================
                    BRAND MARK
                ====================================================== */}

                <div className="hidden items-center gap-2 md:flex">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        HBT Learning
                    </span>
                </div>
            </div>

            {/* Subtle HBT orange accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#F47822]/40 to-transparent" />
        </header>
    );
}