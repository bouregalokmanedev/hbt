import { BookMarked, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  createLessonNote,
  deleteLessonNote,
  getLessonNotes,
  type LessonNote,
  updateLessonNote,
} from "../api/notes.api";

export function LessonNotes({ lessonId }: { lessonId: string }) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [active, setActive] = useState<LessonNote | null>(null);
  const [title, setTitle] = useState("Untitled note");
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
    setTitle("Untitled note");
    setContent("");
  };
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim() || "Untitled note",
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
      <aside className="rounded-2xl border border-gray-100 bg-[#FCFCFC] p-3">
        <button
          type="button"
          onClick={newNote}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-3 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)] transition hover:bg-[#DF6819]"
        >
          <Plus className="h-4 w-4" /> New note
        </button>
        <div className="mt-3 space-y-1">
          {notes.map((note) => (
            <button
              type="button"
              key={note.id}
              onClick={() => select(note)}
              className={`w-full rounded-xl px-3 py-3 text-left transition ${active?.id === note.id ? "bg-white shadow-sm ring-1 ring-[#F47822]/20" : "hover:bg-white"}`}
            >
              <p className="truncate text-sm font-bold text-[#3A3A3A]">
                {note.title}
              </p>
              <p className="mt-1 truncate text-xs text-gray-400">
                {note.content || "Empty note"}
              </p>
            </button>
          ))}
        </div>
      </aside>
      <article className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
              <BookMarked className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                Personal workspace
              </p>
              <p className="text-sm text-gray-500">
                Your notes are private and saved to this lesson.
              </p>
            </div>
          </div>
          {active && (
            <button
              type="button"
              onClick={() => void remove()}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Note title"
          className="mt-6 w-full border-0 border-b border-gray-200 bg-transparent pb-3 text-lg font-bold text-[#3A3A3A] outline-none transition focus:border-[#F47822]"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write down key ideas, reminders, or questions..."
          className="mt-4 min-h-52 w-full resize-y rounded-xl bg-[#FCFCFC] px-4 py-3 text-sm leading-7 text-[#3A3A3A] outline-none ring-1 ring-gray-100 transition focus:bg-white focus:ring-2 focus:ring-[#F47822]/30"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#252525] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save note"}
          </button>
        </div>
      </article>
    </div>
  );
}
