import { BookMarked, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { FavoriteButton } from "@/features/favorites/components/FavoriteButton";

import {
  createLessonNote,
  deleteLessonNote,
  getLessonNotes,
  type LessonNote,
  updateLessonNote,
} from "../api/notes.api";

export function LessonNotes({ lessonId }: { lessonId: string }) {
  const { t } = useTranslation();
  const untitled = t("lessonPlayer.notes.untitled");
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [active, setActive] = useState<LessonNote | null>(null);
  const [title, setTitle] = useState(untitled);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getLessonNotes(lessonId)
      .then((items) => {
        setNotes(items);
        if (items[0]) {
          setActive(items[0]);
          setTitle(items[0].title);
          setContent(items[0].content ?? "");
        }
      })
      .catch(() => setNotes([]));
  }, [lessonId]);

  const select = (note: LessonNote) => {
    setActive(note);
    setTitle(note.title);
    setContent(note.content ?? "");
  };
  const newNote = () => {
    setActive(null);
    setTitle(untitled);
    setContent("");
  };
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim() || untitled,
        content: content.trim() || null,
      };
      const saved = active
        ? await updateLessonNote(lessonId, active.id, data)
        : await createLessonNote(lessonId, data);
      setActive(saved);
      setTitle(saved.title);
      setContent(saved.content ?? "");
      setNotes((items) => [
        saved,
        ...items.filter((item) => item.id !== saved.id),
      ]);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!active) return;
    await deleteLessonNote(lessonId, active.id);
    const remaining = notes.filter((item) => item.id !== active.id);
    setNotes(remaining);
    if (remaining[0]) select(remaining[0]);
    else newNote();
  };

  return (
    <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-gray-100 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] p-3">
        <button
          type="button"
          onClick={newNote}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-3 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)] transition hover:bg-[#DF6819]"
        >
          <Plus className="h-4 w-4" /> {t("lessonPlayer.notes.new")}
        </button>
        <div className="mt-3 space-y-1">
          {notes.map((note) => (
            <button
              type="button"
              key={note.id}
              onClick={() => select(note)}
              className={`w-full rounded-xl px-3 py-3 text-left transition ${active?.id === note.id ? "bg-white dark:bg-[#1b1b20] shadow-sm ring-1 ring-[#F47822]/20" : "hover:bg-white dark:hover:bg-[#1b1b20]"}`}
            >
              <p className="truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                {note.title}
              </p>
              <p className="mt-1 truncate text-xs text-gray-400">
                {note.content || t("lessonPlayer.notes.emptyNote")}
              </p>
            </button>
          ))}
        </div>
      </aside>
      <article className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
              <BookMarked className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                {t("lessonPlayer.notes.eyebrow")}
              </p>
              <p className="text-sm text-gray-500">
                {t("lessonPlayer.notes.desc")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {active && (
              <>
                <FavoriteButton
                  type="note"
                  id={active.id}
                  title={title}
                  variant="solid"
                  size="md"
                />
                <button
                  type="button"
                  onClick={() => void remove()}
                  className="rounded-xl p-2 text-gray-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                  aria-label={t("lessonPlayer.notes.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("lessonPlayer.notes.titlePh")}
          className="mt-6 w-full rounded-b-lg border-0 border-b border-gray-200 dark:border-white/10 bg-transparent px-1 pb-3 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef] outline-none transition focus:border-[#F47822] focus:bg-[#F47822]/[0.04] focus:ring-2 focus:ring-[#F47822]/25"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t("lessonPlayer.notes.contentPh")}
          className="mt-4 min-h-52 w-full resize-y rounded-xl bg-[#FCFCFC] dark:bg-[#232329] px-4 py-3 text-sm leading-7 text-[#3A3A3A] dark:text-[#ececef] outline-none ring-1 ring-gray-100 dark:ring-white/15 transition focus:bg-white dark:focus:bg-[#1b1b20] focus:ring-2 focus:ring-[#F47822]/30"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#252525] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? t("lessonPlayer.notes.saving") : t("lessonPlayer.notes.save")}
          </button>
        </div>
      </article>
    </div>
  );
}
