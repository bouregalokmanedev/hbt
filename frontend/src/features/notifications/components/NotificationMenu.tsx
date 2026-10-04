import { Award, Bell, BookOpenCheck, CheckCheck, ClipboardCheck, Crown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { notificationsApi, type StudentNotification } from "../api/notifications.api";

const icons: Record<string, typeof Bell> = { achievement: Award, course_completed: BookOpenCheck, assessment_ready: ClipboardCheck, assessment_passed: ClipboardCheck, pro: Crown };

export function NotificationMenu({ variant = "ghost" }: { variant?: "ghost" | "raised" } = {}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<StudentNotification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        try { const data = await notificationsApi.list(); setItems(data.items); setUnread(data.unread_count); }
        finally { setLoading(false); }
    };

    useEffect(() => { void load(); const interval = window.setInterval(() => void load(), 60000); return () => window.clearInterval(interval); }, []);
    useEffect(() => { const close = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);

    const openItem = async (item: StudentNotification) => {
        if (!item.read_at) { await notificationsApi.read(item.id); setItems(current => current.map(value => value.id === item.id ? { ...value, read_at: new Date().toISOString() } : value)); setUnread(current => Math.max(0, current - 1)); window.dispatchEvent(new Event("hbt:refresh-badges")); }
        setOpen(false); if (item.conversation_id) navigate(`/messages?conversation=${item.conversation_id}`); else if (item.action_url) navigate(item.action_url);
    };

    const readAll = async () => { await notificationsApi.readAll(); setItems(current => current.map(item => ({ ...item, read_at: item.read_at ?? new Date().toISOString() }))); setUnread(0); window.dispatchEvent(new Event("hbt:refresh-badges")); };

    const buttonClass = variant === "raised"
        ? "relative grid h-9 w-9 place-items-center rounded-xl border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 shadow-[0_4px_12px_rgba(58,58,58,.04)] transition-all hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60 dark:hover:bg-[#F47822]/[0.08]"
        : "relative flex h-9 w-9 items-center justify-center rounded-xl text-[#3A3A3A]/45 transition hover:bg-[#F47822]/8 hover:text-[#F47822] dark:text-white/45";

    return <div ref={menuRef} className="relative"><button type="button" onClick={() => { setOpen(value => !value); if (!open) void load(); }} aria-label={t("notifications.menu.title")} aria-expanded={open} className={buttonClass}><Bell className={variant === "raised" ? "h-4 w-4" : "h-[17px] w-[17px]"}/>{unread > 0 && <span className="absolute end-[7px] top-[6px] flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#F47822] px-1 text-[8px] font-bold text-white ring-2 ring-white">{unread > 9 ? "9+" : unread}</span>}</button>{open && <section className="absolute end-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_18px_45px_rgba(58,58,58,.18)]"><header className="flex items-center justify-between border-b border-[#3A3A3A]/7 dark:border-white/7 px-4 py-3.5"><div><h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("notifications.menu.title")}</h2><p className="mt-0.5 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">{unread ? t("notifications.menu.unread", { count: unread }) : t("notifications.menu.caughtUp")}</p></div>{unread > 0 && <button type="button" onClick={() => void readAll()} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F47822]"><CheckCheck className="h-3.5 w-3.5"/> {t("notifications.menu.markAll")}</button>}</header><div className="max-h-[390px] overflow-y-auto">{loading && !items.length ? <p className="p-8 text-center text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("notifications.menu.loading")}</p> : !items.length ? <div className="p-8 text-center"><Bell className="mx-auto h-7 w-7 text-[#3A3A3A]/20 dark:text-white/20"/><p className="mt-3 text-xs font-semibold text-[#3A3A3A]/55 dark:text-white/55">{t("notifications.menu.empty")}</p><p className="mt-1 text-[11px] leading-5 text-[#3A3A3A]/40 dark:text-white/40">{t("notifications.menu.emptyDesc")}</p></div> : items.map(item => { const Icon = icons[item.type] ?? Bell; return <button type="button" key={item.id} onClick={() => void openItem(item)} className={`flex w-full gap-3 border-b border-[#3A3A3A]/6 dark:border-white/6 px-4 py-3.5 text-start transition hover:bg-[#F47822]/4 ${item.read_at ? "" : "bg-[#F47822]/[.035]"}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><Icon className="h-4 w-4"/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><b className="truncate text-xs text-[#3A3A3A] dark:text-[#ececef]">{item.title}</b>{!item.read_at && <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]"/>}</span><span className="mt-1 block text-[11px] leading-4 text-[#3A3A3A]/55 dark:text-white/55">{item.message}</span></span></button>; })}</div><button type="button" onClick={() => setOpen(false)} className="absolute end-2 top-2 hidden" aria-label={t("notifications.menu.close")}><X/></button></section>}</div>;
}
