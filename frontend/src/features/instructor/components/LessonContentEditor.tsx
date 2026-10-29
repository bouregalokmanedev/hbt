import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bold,
  Code2,
  Eye,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  PencilLine,
  Quote,
  X,
} from "lucide-react";

import { LessonContent } from "@/features/lessons/components/LessonContent";
import type { InstructorLessonMedia } from "../types/instructor";

interface LessonContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  media?: InstructorLessonMedia[];
}

type Mode = "write" | "preview";

const HEADING_PREFIX = "## ";
const BULLET_PREFIX = "- ";
const QUOTE_PREFIX = "> ";
const NUMBERED_PREFIX = /^\d+\.\s/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isImageMedia(item: InstructorLessonMedia): boolean {
  return item.type === "image" || item.mime_type.startsWith("image/");
}

function isEmbeddableMedia(item: InstructorLessonMedia): boolean {
  return (
    isImageMedia(item) ||
    item.type === "document" ||
    item.mime_type === "application/pdf" ||
    item.mime_type.startsWith("text/")
  );
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(html: string): number {
  const text = plainText(html);
  return text ? text.split(" ").length : 0;
}

function afterRender(callback: () => void): void {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(callback);
    return;
  }
  window.setTimeout(callback, 0);
}

export function LessonContentEditor({
  value,
  onChange,
  disabled = false,
  media = [],
}: LessonContentEditorProps) {
  const { t } = useTranslation();
  const baseId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0, text: "" });
  const [mode, setMode] = useState<Mode>("write");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const embeddableMedia = media.filter(isEmbeddableMedia);

  const writeTabId = `${baseId}-write-tab`;
  const previewTabId = `${baseId}-preview-tab`;
  const writePanelId = `${baseId}-write-panel`;
  const previewPanelId = `${baseId}-preview-panel`;

  const words = countWords(value);
  const readMinutes = Math.max(1, Math.ceil(words / 200));
  const editorDisabled = disabled || mode === "preview";

  const focusSelection = (start: number, end: number) => {
    afterRender(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  };

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);

    onChange(next);
    focusSelection(start + before.length, start + before.length + selected.length);
  };

  const prefixLine = (prefix: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? value.length;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const populated = lines.filter((line) => line.trim() !== "");
    const alreadyApplied =
      populated.length > 0 && populated.every((line) => line.startsWith(prefix));

    const nextLines = alreadyApplied
      ? lines.map((line) =>
          line.startsWith(prefix) ? line.slice(prefix.length) : line,
        )
      : lines.map((line) => (line.trim() === "" ? line : prefix + line));

    const nextBlock = nextLines.join("\n");
    const next =
      value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
    const delta = nextBlock.length - block.length;

    onChange(next);
    focusSelection(start + delta, end + delta);
  };

  const toggleHeading = () => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = value.indexOf("\n", Math.max(start, textarea?.selectionEnd ?? start));
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const line = value.slice(lineStart, lineEnd);
    const stripped = line.replace(/^#{1,6}\s+/, "");
    const nextLine = /^#{1,6}\s+/.test(line)
      ? stripped
      : HEADING_PREFIX + stripped;
    const next = value.slice(0, lineStart) + nextLine + value.slice(lineEnd);

    onChange(next);
    focusSelection(
      lineStart + nextLine.length,
      lineStart + nextLine.length,
    );
  };

  const toggleNumberedList = () => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? value.length;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const populated = lines.filter((line) => line.trim() !== "");
    const alreadyApplied =
      populated.length > 0 &&
      populated.every((line) => NUMBERED_PREFIX.test(line));

    const nextLines = alreadyApplied
      ? lines.map((line) => line.replace(NUMBERED_PREFIX, ""))
      : lines.map((line, index) =>
          line.trim() === "" ? line : `${index + 1}. ${line}`,
        );

    const nextBlock = nextLines.join("\n");
    const next =
      value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
    const delta = nextBlock.length - block.length;

    onChange(next);
    focusSelection(start + delta, end + delta);
  };

  const openLink = () => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    selectionRef.current = { start, end, text: value.slice(start, end) };
    setLinkUrl("");
    setLinkText(value.slice(start, end));
    setLinkError(false);
    setMediaOpen(false);
    setLinkOpen(true);
  };

  const cancelLink = () => {
    setLinkOpen(false);
    setLinkError(false);
    textareaRef.current?.focus();
  };

  const openMediaPicker = () => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    selectionRef.current = { start, end, text: value.slice(start, end) };
    setLinkOpen(false);
    setLinkError(false);
    setMediaOpen(true);
  };

  const cancelMediaPicker = () => {
    setMediaOpen(false);
    textareaRef.current?.focus();
  };

  const insertMedia = (item: InstructorLessonMedia) => {
    const snippet = isImageMedia(item)
      ? `<img data-media-id="${escapeHtml(item.id)}" alt="${escapeHtml(item.original_name)}">`
      : `<a href="#" data-media-id="${escapeHtml(item.id)}">${escapeHtml(item.original_name)}</a>`;
    const { start, end } = selectionRef.current;
    const next = value.slice(0, start) + snippet + value.slice(end);

    onChange(next);
    setMediaOpen(false);
    focusSelection(start + snippet.length, start + snippet.length);
  };

  const insertLink = () => {
    const raw = linkUrl.trim();
    if (!raw || /^(javascript|data|vbscript):/i.test(raw)) {
      setLinkError(true);
      return;
    }

    const href = /^(https?:\/\/|mailto:|\/|#)/i.test(raw)
      ? raw
      : `https://${raw}`;
    const label = linkText.trim() || href;
    const anchor = `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    const { start, end } = selectionRef.current;
    const next = value.slice(0, start) + anchor + value.slice(end);

    onChange(next);
    setLinkOpen(false);
    setLinkError(false);
    focusSelection(start + anchor.length, start + anchor.length);
  };

  const toolButtonClass =
    "grid h-8 w-8 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/65 transition hover:border-[#F47822]/35 hover:bg-[#F47822]/8 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/60 dark:hover:border-[#F47822]/35 dark:hover:bg-[#F47822]/10 dark:hover:text-[#F9A16C]";

  return (
    <div data-testid="lesson-content-editor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`${baseId}-textarea`}
          className="text-[11px] font-semibold text-[#3A3A3A]/65 dark:text-white/65"
        >
          {t("instructor.curriculum.editor.contentLabel")}
        </label>

        <div
          role="tablist"
          aria-label={t("instructor.curriculum.editor.contentLabel")}
          className="inline-flex rounded-lg border border-[#3A3A3A]/10 bg-[#F5F5F5] p-0.5 dark:border-white/10 dark:bg-white/5"
        >
          <button
            type="button"
            role="tab"
            id={writeTabId}
            aria-selected={mode === "write"}
            aria-controls={writePanelId}
            data-testid="lesson-editor-tab-write"
            onClick={() => setMode("write")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
              mode === "write"
                ? "bg-white text-[#3A3A3A] shadow-sm dark:bg-[#2A2A31] dark:text-white"
                : "text-[#3A3A3A]/45 hover:text-[#3A3A3A] dark:text-white/45 dark:hover:text-white"
            }`}
          >
            <PencilLine className="h-3 w-3" />
            {t("instructor.curriculum.editor.write")}
          </button>
          <button
            type="button"
            role="tab"
            id={previewTabId}
            aria-selected={mode === "preview"}
            aria-controls={previewPanelId}
            data-testid="lesson-editor-tab-preview"
            onClick={() => {
              setLinkOpen(false);
              setMediaOpen(false);
              setMode("preview");
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
              mode === "preview"
                ? "bg-white text-[#3A3A3A] shadow-sm dark:bg-[#2A2A31] dark:text-white"
                : "text-[#3A3A3A]/45 hover:text-[#3A3A3A] dark:text-white/45 dark:hover:text-white"
            }`}
          >
            <Eye className="h-3 w-3" />
            {t("instructor.curriculum.editor.preview")}
          </button>
        </div>
      </div>

      <div className="mt-2 overflow-hidden rounded-xl border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#151519]">
        <div className="flex flex-wrap items-center gap-px border-b border-[#3A3A3A]/8 bg-[#FCFCFC] px-1.5 py-1.5 dark:border-white/8 dark:bg-white/[0.03]">
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.bold")}
            title={t("instructor.curriculum.editor.toolbar.bold")}
            data-testid="lesson-toolbar-bold"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => wrapSelection("<strong>", "</strong>")}
            className={toolButtonClass}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.italic")}
            title={t("instructor.curriculum.editor.toolbar.italic")}
            data-testid="lesson-toolbar-italic"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => wrapSelection("<em>", "</em>")}
            className={toolButtonClass}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[#3A3A3A]/10 dark:bg-white/10" />
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.heading")}
            title={t("instructor.curriculum.editor.toolbar.heading")}
            data-testid="lesson-toolbar-heading"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggleHeading}
            className={toolButtonClass}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.bulletList")}
            title={t("instructor.curriculum.editor.toolbar.bulletList")}
            data-testid="lesson-toolbar-bullet-list"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => prefixLine(BULLET_PREFIX)}
            className={toolButtonClass}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.numberedList")}
            title={t("instructor.curriculum.editor.toolbar.numberedList")}
            data-testid="lesson-toolbar-numbered-list"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggleNumberedList}
            className={toolButtonClass}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.quote")}
            title={t("instructor.curriculum.editor.toolbar.quote")}
            data-testid="lesson-toolbar-quote"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => prefixLine(QUOTE_PREFIX)}
            className={toolButtonClass}
          >
            <Quote className="h-3.5 w-3.5" />
          </button>
          <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[#3A3A3A]/10 dark:bg-white/10" />
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.code")}
            title={t("instructor.curriculum.editor.toolbar.code")}
            data-testid="lesson-toolbar-code"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => wrapSelection("<code>", "</code>")}
            className={toolButtonClass}
          >
            <Code2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.link")}
            title={t("instructor.curriculum.editor.toolbar.link")}
            data-testid="lesson-toolbar-link"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={openLink}
            className={toolButtonClass}
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={t("instructor.curriculum.editor.toolbar.media")}
            title={t("instructor.curriculum.editor.toolbar.media")}
            aria-expanded={mediaOpen}
            data-testid="lesson-toolbar-media"
            disabled={editorDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={openMediaPicker}
            className={toolButtonClass}
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </button>
        </div>

        {mode === "write" ? (
          <div
            id={writePanelId}
            role="tabpanel"
            aria-labelledby={writeTabId}
            className="p-3"
          >
            {mediaOpen && (
              <div
                role="group"
                aria-label={t("instructor.curriculum.editor.mediaPickerTitle")}
                data-testid="lesson-media-picker"
                className="mb-3 rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] p-3 dark:bg-[#F47822]/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-[#3A3A3A] dark:text-[#ececef]">
                      {t("instructor.curriculum.editor.mediaPickerTitle")}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-[#3A3A3A]/50 dark:text-white/50">
                      {t("instructor.curriculum.editor.mediaPickerHint")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={cancelMediaPicker}
                    aria-label={t("instructor.curriculum.editor.mediaPickerClose")}
                    className="rounded-md p-1 text-[#3A3A3A]/40 transition hover:bg-white hover:text-[#3A3A3A] dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {embeddableMedia.length > 0 ? (
                  <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                    {embeddableMedia.map((item) => {
                      const image = isImageMedia(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`lesson-media-option-${item.id}`}
                          aria-label={t(
                            image
                              ? "instructor.curriculum.editor.mediaPickerInsertImage"
                              : "instructor.curriculum.editor.mediaPickerInsertDocument",
                            { name: item.original_name },
                          )}
                          onClick={() => insertMedia(item)}
                          className="flex min-w-0 items-center gap-2.5 rounded-lg border border-[#3A3A3A]/10 bg-white p-2 text-start transition hover:border-[#F47822]/40 hover:bg-[#F47822]/5 dark:border-white/10 dark:bg-[#151519] dark:hover:border-[#F47822]/40 dark:hover:bg-[#F47822]/10"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-[#F47822]/10 text-[#F47822]">
                            {image ? (
                              <img
                                src={item.url}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Paperclip className="h-4 w-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                              {item.original_name}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                              {image
                                ? t("instructor.curriculum.editor.mediaPickerImage")
                                : t("instructor.curriculum.editor.mediaPickerDocument")}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[10px] leading-5 text-[#3A3A3A]/50 dark:bg-[#151519] dark:text-white/50">
                    {t("instructor.curriculum.editor.mediaPickerEmpty")}
                  </p>
                )}
              </div>
            )}
            {linkOpen && (
              <div className="mb-3 rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] p-3 dark:bg-[#F47822]/8">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/50 dark:text-white/50">
                      {t("instructor.curriculum.editor.linkUrl")}
                    </span>
                    <input
                      autoFocus
                      value={linkUrl}
                      onChange={(event) => {
                        setLinkUrl(event.target.value);
                        setLinkError(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          insertLink();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelLink();
                        }
                      }}
                      placeholder="https://"
                      aria-label={t("instructor.curriculum.editor.linkUrl")}
                      aria-invalid={linkError}
                      className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/12 bg-white px-2.5 text-xs outline-none focus:border-[#F47822] dark:border-white/12 dark:bg-[#151519]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/50 dark:text-white/50">
                      {t("instructor.curriculum.editor.linkText")}
                    </span>
                    <input
                      value={linkText}
                      onChange={(event) => setLinkText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          insertLink();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelLink();
                        }
                      }}
                      placeholder={t("instructor.curriculum.editor.linkTextPh")}
                      aria-label={t("instructor.curriculum.editor.linkText")}
                      className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/12 bg-white px-2.5 text-xs outline-none focus:border-[#F47822] dark:border-white/12 dark:bg-[#151519]"
                    />
                  </label>
                </div>
                {linkError && (
                  <p role="alert" className="mt-2 text-[10px] font-semibold text-red-600 dark:text-red-400">
                    {t("instructor.curriculum.editor.linkInvalid")}
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={insertLink}
                    data-testid="lesson-link-insert"
                    className="rounded-lg bg-[#F47822] px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#de6414]"
                  >
                    {t("instructor.curriculum.editor.linkInsert")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelLink}
                    className="rounded-lg border border-[#3A3A3A]/10 px-3 py-1.5 text-[10px] font-bold text-[#3A3A3A]/60 transition hover:border-[#3A3A3A]/25 dark:border-white/10 dark:text-white/60 dark:hover:border-white/25"
                  >
                    {t("instructor.curriculum.editor.linkCancel")}
                  </button>
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              id={`${baseId}-textarea`}
              data-testid="lesson-content-write"
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (disabled) return;
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
                  event.preventDefault();
                  wrapSelection("<strong>", "</strong>");
                }
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
                  event.preventDefault();
                  wrapSelection("<em>", "</em>");
                }
              }}
              rows={12}
              placeholder={t("instructor.curriculum.contentPh")}
              aria-label={t("instructor.curriculum.editor.contentLabel")}
              className="min-h-[220px] w-full resize-y rounded-lg border border-[#3A3A3A]/10 bg-white px-3 py-2.5 font-mono text-[12px] leading-6 outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#151519]"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] leading-4 text-[#3A3A3A]/45 dark:text-white/45">
                {t("instructor.curriculum.editor.contentHint")}
              </p>
              <p
                className="shrink-0 font-mono text-[10px] text-[#3A3A3A]/45 dark:text-white/45"
                data-testid="lesson-content-stats"
              >
                {words === 1
                  ? t("instructor.curriculum.editor.wordCountOne")
                  : t("instructor.curriculum.editor.wordCountMany", { count: words })}
                {words > 0 && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {t("instructor.curriculum.editor.readTime", {
                      count: readMinutes,
                    })}
                  </>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div
            id={previewPanelId}
            role="tabpanel"
            aria-labelledby={previewTabId}
            data-testid="lesson-content-preview"
            className="min-h-[260px] bg-[#FCFCFC] p-4 dark:bg-[#151519] sm:p-5"
          >
            {value.trim() ? (
              <LessonContent html={value} media={media} />
            ) : (
              <p className="text-xs leading-6 text-[#3A3A3A]/40 dark:text-white/40">
                {t("instructor.curriculum.editor.previewEmpty")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
