import {
    Award,
    BookOpen,
    Clock3,
    GraduationCap,
    Heart,
    HeartCrack,
    LayoutGrid,
    Loader2,
    PlayCircle,
    Search,
    Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useFavoritesStore } from "../store/favorites.store";
import type { FavoriteItem, FavoriteType } from "../types";

type Tab = "all" | FavoriteType;

function formatDuration(minutes: number | null | undefined, t: (key: string, options?: Record<string, number>) => string): string | null {
    if (minutes === null || minutes === undefined) return null;
    if (minutes < 60) return t("favourites.minutes", { m: minutes });
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0
        ? t("favourites.hoursEven", { h: hours })
        : t("favourites.hoursMinutes", { h: hours, m: rest });
}

function lessonHref(item: FavoriteItem): string {
    if (item.course_id) return `/courses/${item.course_id}/lessons/${item.id}`;
    return "/catalog";
}

export function FavouritesPage() {
    const { t, i18n } = useTranslation();
    const favorites = useFavoritesStore((state) => state.favorites);
    const loading = useFavoritesStore((state) => state.loading);
    const loaded = useFavoritesStore((state) => state.loaded);
    const refresh = useFavoritesStore((state) => state.refresh);
    const remove = useFavoritesStore((state) => state.remove);
    const pendingKeys = useFavoritesStore((state) => state.pendingKeys);

    const [tab, setTab] = useState<Tab>("all");
    const [query, setQuery] = useState("");

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const items = useMemo(() => Object.values(favorites), [favorites]);
    const courseCount = items.filter((item) => item.type === "course").length;
    const lessonCount = items.filter((item) => item.type === "lesson").length;

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return items.filter((item) => {
            if (tab !== "all" && item.type !== tab) return false;
            if (!needle) return true;
            return (
                item.title.toLowerCase().includes(needle) ||
                (item.course_title ?? "").toLowerCase().includes(needle)
            );
        });
    }, [items, tab, query]);

    const courses = visible.filter((item) => item.type === "course");
    const lessons = visible.filter((item) => item.type === "lesson");

    const tabs: Array<{ id: Tab; label: string; count: number }> = [
        { id: "all", label: t("favourites.tabs.all"), count: items.length },
        { id: "course", label: t("favourites.tabs.courses"), count: courseCount },
        { id: "lesson", label: t("favourites.tabs.lessons"), count: lessonCount },
    ];

    return (
        <main className="min-h-full bg-background">
            <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                {/* ================= HERO ================= */}
                <section className="overflow-hidden rounded-3xl bg-[#3A3A3A] p-7 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        {t("favourites.hero.eyebrow")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <h1 className="flex items-center gap-2.5 text-2xl font-bold">
                                {t("favourites.hero.title")}
                                <Heart className="h-6 w-6 fill-[#F47822] text-[#F47822]" />
                            </h1>
                            <p className="mt-1 text-sm text-white/60">
                                {t("favourites.hero.description")}
                            </p>
                        </div>
                        <div className="flex gap-2.5">
                            <div className="flex min-w-[120px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3 backdrop-blur-sm">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,0.25)]">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">{t("favourites.hero.courses")}</p>
                                    <p className="mt-0.5 text-lg font-bold leading-none">{courseCount}</p>
                                </div>
                            </div>
                            <div className="flex min-w-[120px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3 backdrop-blur-sm">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                                    <PlayCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">{t("favourites.hero.lessons")}</p>
                                    <p className="mt-0.5 text-lg font-bold leading-none">{lessonCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= TOOLBAR ================= */}
                <section className="mt-6 flex flex-col gap-3 rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-4 shadow-[0_8px_30px_rgba(58,58,58,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex gap-1.5 rounded-2xl bg-[#F3F3F3] dark:bg-[#101013] p-1.5">
                        {tabs.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => setTab(entry.id)}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                    tab === entry.id
                                        ? "bg-[#3A3A3A] text-white shadow"
                                        : "text-[#3A3A3A]/55 dark:text-white/55 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"
                                }`}
                            >
                                {entry.id === "all" && <LayoutGrid className="h-3.5 w-3.5" />}
                                {entry.id === "course" && <BookOpen className="h-3.5 w-3.5" />}
                                {entry.id === "lesson" && <PlayCircle className="h-3.5 w-3.5" />}
                                {entry.label}
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        tab === entry.id ? "bg-[#F47822] text-white" : "bg-[#3A3A3A]/8 dark:bg-white/8 text-[#3A3A3A]/55 dark:text-white/55"
                                    }`}
                                >
                                    {entry.count}
                                </span>
                            </button>
                        ))}
                    </div>
                    <label className="relative block sm:w-72">
                        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35 dark:text-white/35" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t("favourites.searchPh")}
                            className="h-11 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#F7F7F7] dark:bg-[#101013] pe-4 ps-10 text-sm text-[#3A3A3A] dark:text-[#ececef] outline-none transition placeholder:text-[#3A3A3A]/35 dark:placeholder:text-white/35 focus:border-[#F47822]/50 focus:bg-white dark:focus:bg-[#1b1b20] focus:shadow-[0_8px_24px_rgba(244,120,34,0.08)]"
                        />
                    </label>
                </section>

                {/* ================= CONTENT ================= */}
                {!loaded || loading ? (
                    <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label={t("favourites.loadingAria")}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="animate-pulse overflow-hidden rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20]">
                                <div className="aspect-[16/9] bg-[#3A3A3A]/8 dark:bg-white/8" />
                                <div className="space-y-2.5 p-6">
                                    <div className="h-4 w-3/4 rounded bg-[#3A3A3A]/8 dark:bg-white/8" />
                                    <div className="h-3 w-1/2 rounded bg-[#3A3A3A]/8 dark:bg-white/8" />
                                </div>
                            </div>
                        ))}
                    </section>
                ) : visible.length === 0 ? (
                    <section className="mt-6 rounded-3xl border border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-white dark:bg-[#1b1b20] px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10">
                            {items.length === 0 ? (
                                <Heart className="h-7 w-7 text-[#F47822]" />
                            ) : (
                                <HeartCrack className="h-7 w-7 text-[#F47822]" />
                            )}
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
                            {items.length === 0 ? t("favourites.emptyTitle") : t("favourites.emptyFilteredTitle")}
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-[#3A3A3A]/55 dark:text-white/55">
                            {items.length === 0
                                ? t("favourites.emptyDesc")
                                : t("favourites.emptyFilteredDesc")}
                        </p>
                        {items.length === 0 && (
                            <Link
                                to="/catalog"
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition hover:bg-[#E96D18]"
                            >
                                <Sparkles className="h-4 w-4" />
                                {t("favourites.exploreBtn")}
                            </Link>
                        )}
                    </section>
                ) : (
                    <div className="mt-6 space-y-8">
                        {courses.length > 0 && (
                            <section aria-label={t("favourites.favCoursesAria")}>
                                <SectionHeading icon={BookOpen} title={t("favourites.savedCourses")} count={courses.length} />
                                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                    {courses.map((item) => (
                                        <FavouriteCourseCard
                                            key={`course:${item.id}`}
                                            item={item}
                                            busy={pendingKeys.includes(`course:${item.id}`)}
                                            onRemove={() => void remove("course", item.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                        {lessons.length > 0 && (
                            <section aria-label={t("favourites.favLessonsAria")}>
                                <SectionHeading icon={PlayCircle} title={t("favourites.savedLessons")} count={lessons.length} />
                                <div className="mt-4 grid gap-3">
                                    {lessons.map((item) => (
                                        <FavouriteLessonRow
                                            key={`lesson:${item.id}`}
                                            item={item}
                                            busy={pendingKeys.includes(`lesson:${item.id}`)}
                                            onRemove={() => void remove("lesson", item.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

function SectionHeading({ icon: Icon, title, count }: { icon: typeof BookOpen; title: string; count: number }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F47822]/10">
                <Icon className="h-4 w-4 text-[#F47822]" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#3A3A3A] dark:text-[#ececef]">{title}</h2>
            <span className="rounded-full bg-[#3A3A3A]/8 dark:bg-white/8 px-2 py-0.5 text-[11px] font-bold text-[#3A3A3A]/60 dark:text-white/60">{count}</span>
            <span className="ms-2 h-px flex-1 bg-[#3A3A3A]/8 dark:bg-white/8" />
        </div>
    );
}

function FavouriteCourseCard({ item, busy, onRemove }: { item: FavoriteItem; busy: boolean; onRemove: () => void }) {
    const { t } = useTranslation();
    const duration = formatDuration(item.duration_minutes, t);
    return (
        <article className="group relative overflow-hidden rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(58,58,58,0.05)] transition hover:-translate-y-0.5 hover:border-[#F47822]/30 hover:shadow-[0_14px_34px_rgba(58,58,58,0.10)]">
            <Link to={`/courses/${item.id}`} className="block">
                <div className="relative aspect-[16/9] overflow-hidden bg-[#242424]">
                    {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <span className="text-2xl font-black text-[#F47822]">H</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                        {item.is_free ? (
                            <span className="rounded-full bg-[#F47822] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white">{t("favourites.free")}</span>
                        ) : null}
                        {item.difficulty ? (
                            <span className="rounded-full border border-white/25 bg-black/30 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md">
                                {item.difficulty}
                            </span>
                        ) : null}
                    </div>
                </div>
                <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">{t("favourites.savedCourse")}</p>
                    <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-[#3A3A3A] dark:text-[#ececef] transition group-hover:text-[#F47822]">
                        {item.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                        {duration && (
                            <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" />
                                {duration}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {t("favourites.continueLearning")}
                        </span>
                    </div>
                </div>
            </Link>
            <button
                type="button"
                onClick={onRemove}
                disabled={busy}
                aria-label={t("favourites.removeCourseAria", { title: item.title })}
                title={t("favourites.removeTitle")}
                className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition hover:border-[#F47822] hover:bg-[#F47822] hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-[18px] w-[18px] fill-current" />}
            </button>
        </article>
    );
}

function FavouriteLessonRow({ item, busy, onRemove }: { item: FavoriteItem; busy: boolean; onRemove: () => void }) {
    const { t } = useTranslation();
    const duration = formatDuration(item.duration_minutes, t);
    return (
        <article className="group flex items-center gap-4 rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-4 shadow-[0_6px_20px_rgba(58,58,58,0.04)] transition hover:border-[#F47822]/30 sm:gap-5 sm:p-5">
            <Link
                to={lessonHref(item)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822] transition group-hover:bg-[#F47822] group-hover:text-white"
                aria-label={t("favourites.openLessonAria", { title: item.title })}
            >
                <PlayCircle className="h-6 w-6" />
            </Link>
            <Link to={lessonHref(item)} className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">
                    {t("favourites.savedLesson")}{item.course_title ? ` · ${item.course_title}` : ""}
                </p>
                <h3 className="mt-0.5 truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef] transition group-hover:text-[#F47822] sm:text-base">
                    {item.title}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                    {duration && (
                        <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {duration}
                        </span>
                    )}
                    {item.is_preview && <span className="font-semibold text-[#F47822]">{t("favourites.preview")}</span>}
                </div>
            </Link>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 md:inline-flex">
                <Award className="h-3.5 w-3.5" />
                {t("favourites.saved")}
            </span>
            <button
                type="button"
                onClick={onRemove}
                disabled={busy}
                aria-label={t("favourites.removeCourseAria", { title: item.title })}
                title={t("favourites.removeTitle")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3A3A3A]/10 dark:border-white/10 text-[#3A3A3A]/40 dark:text-white/40 transition hover:border-red-200 dark:hover:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 disabled:cursor-wait disabled:opacity-60"
            >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4 fill-[#F47822] text-[#F47822]" />}
            </button>
        </article>
    );
}
