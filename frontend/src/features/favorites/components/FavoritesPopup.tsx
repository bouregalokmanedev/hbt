import { BookOpen, CheckCircle2, Heart, PlayCircle, Star, StickyNote, X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useFavoritesStore } from "../store/favorites.store";

export function FavoritesPopup() {
    const { t } = useTranslation();
    const notice = useFavoritesStore((state) => state.notice);
    const dismissNotice = useFavoritesStore((state) => state.dismissNotice);

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => dismissNotice(), 2800);
        return () => window.clearTimeout(timer);
    }, [notice, dismissNotice]);

    if (!notice) return null;

    const KindIcon = notice.kind === "note" ? StickyNote : notice.kind === "course" ? BookOpen : PlayCircle;
    const AddedIcon = notice.kind === "note" ? Star : Heart;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
        >
            <div className="flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-[#2b2b2b]/95 py-3 pe-3 ps-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        notice.added
                            ? "bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,0.45)]"
                            : "bg-white/10 text-white/70"
                    }`}
                >
                    {notice.added ? <AddedIcon className="h-5 w-5 fill-current" /> : <CheckCircle2 className="h-5 w-5" />}
                </span>

                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        <KindIcon className="h-3 w-3" />
                        {notice.kind === "course"
                            ? (notice.added ? t("favourites.notice.courseSaved") : t("favourites.notice.courseRemoved"))
                            : notice.kind === "note"
                                ? (notice.added ? t("favourites.notice.noteSaved") : t("favourites.notice.noteRemoved"))
                                : (notice.added ? t("favourites.notice.lessonSaved") : t("favourites.notice.lessonRemoved"))}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-white">
                        {notice.added ? t("favourites.notice.added", { title: notice.title }) : t("favourites.notice.removed", { title: notice.title })}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={dismissNotice}
                    aria-label={t("favourites.notice.dismissAria")}
                    className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>

                <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[fav-toast-bar_2.8s_linear] bg-[#F47822]" />
            </div>
            <style>{`@keyframes fav-toast-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
        </div>
    );
}
