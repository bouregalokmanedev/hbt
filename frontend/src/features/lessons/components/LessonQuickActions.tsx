import { Bot, LifeBuoy, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { MentorChatPanel } from "@/features/ai-mentor/components/MentorChatPanel";
import { useHelpStore } from "@/components/help/help.store";

interface Props {
    lessonTitle: string;
    lessonId?: string;
    courseId?: string;
}

/**
 * Single floating launcher for the lesson player: one plus button in the
 * corner that pops open the two actions that used to overlap here — the AI
 * mentor chat and the shared help panel.
 */
export function LessonQuickActions({ lessonTitle, lessonId, courseId }: Props) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [hovered, setHovered] = useState(false);
    const [pinned, setPinned] = useState(false);
    const [mentorOpen, setMentorOpen] = useState(false);
    const openHelp = useHelpStore((state) => state.openPanel);

    const expanded = hovered || pinned;

    // Touch and keyboard users have no hover, so the plus pins the popup and
    // Escape or a tap outside puts it away again.
    useEffect(() => {
        if (!pinned) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setPinned(false);
        };
        const onPointerDown = (event: PointerEvent) => {
            if (containerRef.current?.contains(event.target as Node)) return;
            setPinned(false);
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [pinned]);

    const launchMentor = () => {
        setPinned(false);
        setHovered(false);
        setMentorOpen(true);
    };

    const launchHelp = () => {
        setPinned(false);
        setHovered(false);
        openHelp();
    };

    return (
        <>
            <div
                ref={containerRef}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="fixed bottom-5 end-5 z-40 flex flex-col items-end gap-3"
            >
                <div
                    role="menu"
                    aria-label={t("lessonPlayer.quick.more")}
                    className={`flex flex-col items-end gap-2.5 transition-all duration-200 ease-out ${expanded ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-90 opacity-0"}`}
                >
                    <QuickAction label={t("lessonPlayer.mentor.ask")} onClick={launchMentor}>
                        <Bot className="h-5 w-5" />
                    </QuickAction>
                    <QuickAction label={t("help.widget.open")} onClick={launchHelp}>
                        <LifeBuoy className="h-5 w-5" />
                    </QuickAction>
                </div>

                <button
                    type="button"
                    onClick={() => setPinned((value) => !value)}
                    onMouseEnter={() => setHovered(true)}
                    aria-expanded={expanded}
                    aria-haspopup="true"
                    aria-label={t("lessonPlayer.quick.more")}
                    title={t("lessonPlayer.quick.more")}
                    className="flex h-13 w-13 items-center justify-center rounded-full bg-[#F47822] text-white shadow-[0_12px_30px_rgba(244,120,34,0.4)] transition hover:scale-105 hover:bg-[#E96D18] focus:outline-none focus:ring-4 focus:ring-[#F47822]/25"
                >
                    <Plus className={`h-6 w-6 transition-transform duration-200 ${expanded ? "rotate-45" : ""}`} />
                </button>
            </div>

            {mentorOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-end bg-[#17202b]/30 p-3 backdrop-blur-sm sm:p-6">
                    <div className="flex h-[min(720px,calc(100vh-1.5rem))] w-full max-w-xl flex-col">
                        <div className="mb-2 flex items-center justify-between px-2 text-white">
                            <div className="flex items-center gap-2 text-xs font-semibold">
                                <Bot className="h-4 w-4 text-[#F47822]" /> {t("lessonPlayer.mentor.title")} · {lessonTitle}
                            </div>
                            <button
                                type="button"
                                onClick={() => setMentorOpen(false)}
                                aria-label={t("lessonPlayer.mentor.close")}
                                className="rounded-lg p-1.5 transition hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <MentorChatPanel
                            compact
                            context={{ title: t("lessonPlayer.mentor.helpTitle", { title: lessonTitle }), lessonId, courseId }}
                            subtitle={t("lessonPlayer.mentor.subtitle")}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

/**
 * Circled speed-dial button. The title stays hidden until the pointer rests
 * on the button, then fades and scales in smoothly toward the screen edge
 * (logical properties keep it pointing at the centre in both LTR and RTL).
 */
function QuickAction({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            aria-label={label}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-[#3A3A3A]/10 bg-white text-[#F47822] shadow-[0_10px_26px_rgba(58,58,58,0.18)] transition-all duration-200 hover:scale-110 hover:border-[#F47822] hover:bg-[#F47822] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#F47822]/25 dark:border-white/10 dark:bg-[#1b1b20] dark:text-[#F47822] dark:hover:bg-[#F47822] dark:hover:text-white"
        >
            {children}
            <span
                role="tooltip"
                className="pointer-events-none absolute end-full top-1/2 me-3 -translate-y-1/2 scale-95 whitespace-nowrap rounded-full bg-[#3A3A3A] px-3 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-lg transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 dark:bg-[#26262c]"
            >
                {label}
            </span>
        </button>
    );
}
