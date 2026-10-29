import { sanitizeHtml } from "@/lib/sanitize-html";

export interface LessonContentMedia {
  id: string;
  url: string;
  original_name: string;
  type?: string;
  mime_type?: string;
}

/**
 * Media URLs are short-lived signed links, so lesson HTML stores a stable
 * `data-media-id` reference instead. Resolve those references to the fresh
 * URLs that arrived with the lesson payload at render time.
 */
function resolveMediaReferences(
  html: string,
  media: LessonContentMedia[],
): string {
  if (typeof document === "undefined") return html;

  const byId = new Map(media.map((item) => [item.id, item]));
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content
    .querySelectorAll<HTMLElement>("[data-media-id]")
    .forEach((node) => {
      const id = node.getAttribute("data-media-id");
      const item = id ? byId.get(id) : undefined;

      if (!item?.url) {
        node.remove();
        return;
      }

      if (node.tagName === "IMG") {
        node.setAttribute("src", item.url);
        if (!node.getAttribute("alt")) {
          node.setAttribute("alt", item.original_name);
        }
        return;
      }

      if (node.tagName === "A") {
        node.setAttribute("href", item.url);
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
        return;
      }

      node.remove();
    });

  return template.innerHTML;
}

/**
 * Renders authored lesson HTML with the shared `.hbt-prose` typography.
 * Used by the learner player and the instructor preview so both surfaces
 * always agree on how content will look.
 */
export function LessonContent({
  html,
  media = [],
  className = "",
}: {
  html: string | null | undefined;
  media?: LessonContentMedia[];
  className?: string;
}) {
  if (!html || !html.trim()) return null;

  const resolved = resolveMediaReferences(sanitizeHtml(html), media);

  return (
    <div
      className={["hbt-prose", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: resolved }}
    />
  );
}
