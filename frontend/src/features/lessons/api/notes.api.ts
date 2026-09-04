import { api } from "@/lib/api/api";

export type LessonNote = {
  id: string;
  title: string;
  content: string | null;
  updated_at: string;
};

export const getLessonNotes = (lessonId: string) =>
  api<LessonNote[]>(`/v1/lessons/${lessonId}/notes`);
export const createLessonNote = (
  lessonId: string,
  data: Pick<LessonNote, "title" | "content">,
) =>
  api<LessonNote>(`/v1/lessons/${lessonId}/notes`, {
    method: "POST",
    body: data,
  });
export const updateLessonNote = (
  lessonId: string,
  noteId: string,
  data: Partial<Pick<LessonNote, "title" | "content">>,
) =>
  api<LessonNote>(`/v1/lessons/${lessonId}/notes/${noteId}`, {
    method: "PATCH",
    body: data,
  });
export const deleteLessonNote = (lessonId: string, noteId: string) =>
  api<void>(`/v1/lessons/${lessonId}/notes/${noteId}`, { method: "DELETE" });
