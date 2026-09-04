import { ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import type { LessonMedia } from "../types/lesson.types";

export function LessonResources({ media }: { media: LessonMedia[] }) {
  const documents = media.filter((item) => item.type === "document");
  const images = media.filter((item) => item.type === "image");
  return (
    <div className="p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#F47822]">
            Study support
          </p>
          <h2 className="text-xl font-bold text-[#3A3A3A]">
            Lesson documentation
          </h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-gray-600">
        Reference files and visual materials shared by your instructor for this
        lesson.
      </p>
      {documents.length === 0 && images.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-[#FCFCFC] p-8 text-center text-sm text-gray-500">
          No documentation has been attached yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {documents.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-[#FCFCFC] p-3 transition hover:border-[#F47822]/30 hover:bg-[#FFF8F4]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#3A3A3A]">
                {item.original_name}
              </span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          ))}
          {images.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-100"
            >
              <img
                src={item.url}
                alt={item.original_name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/55 px-3 py-2 text-xs font-semibold text-white">
                <ImageIcon className="h-3.5 w-3.5" />
                {item.original_name}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
