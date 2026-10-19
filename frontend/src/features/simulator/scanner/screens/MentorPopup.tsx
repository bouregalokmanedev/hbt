import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Bot, X } from "lucide-react";

import { MentorChatPanel } from "@/features/ai-mentor/components/MentorChatPanel";

/* Floating AI mentor window for the scanner lab: a modal chat popup
   (rendered on document.body so the tablet's 3D stacking context can't
   clip it) with the prompt pre-filled when opened from a DTC row. */

type Props = {
    open: boolean;
    initialPrompt?: string;
    onClose: () => void;
};

export function MentorPopup({ open, initialPrompt = "", onClose }: Props) {
    const { t } = useTranslation();
    const mp = "simulator.scannerLab.mentorPopup";
    const [input, setInput] = useState(initialPrompt);

    useEffect(() => {
        if (open) setInput(initialPrompt);
    }, [open, initialPrompt]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={t(`${mp}.title`)}
            data-testid="mentor-popup"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(15, 20, 30, 0.62)" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="flex h-[min(86vh,780px)] w-[min(94vw,880px)] min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                style={{ border: "1px solid #3a3a3a22" }}
            >
                <div
                    className="flex shrink-0 items-center justify-between border-b border-[#3a3a3a1a] px-5 py-3"
                    style={{ background: "#f7f8fa" }}
                >
                    <div className="flex items-center gap-2">
                        <span
                            aria-hidden="true"
                            className="grid h-7 w-7 place-items-center rounded-full text-white"
                            style={{ background: "linear-gradient(180deg,#2a7be0,#0e4fb4)" }}
                        >
                            <Bot className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-black text-[#1a1d22]">
                            {t(`${mp}.title`)}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label={t(`${mp}.close`)}
                        data-testid="mentor-popup-close"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[#5c6672] transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="min-h-0 flex-1">
                    <MentorChatPanel
                        hideHeader
                        flush
                        compact
                        className="h-full w-full min-h-0"
                        context={{
                            title: t(`${mp}.title`),
                            forceNew: true,
                        }}
                        input={input}
                        onInputChange={setInput}
                        onPrompt={(text) => setInput(text)}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}
