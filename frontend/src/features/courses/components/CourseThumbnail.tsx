import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import heropic from "@/assets/landing/heropic.webp";
import heropic2 from "@/assets/landing/heropic2.webp";
import { env } from "@/config/env";

interface CourseThumbnailProps {
    title: string;
    image?: string | null;
    video?: string | null;
    showMute?: boolean;
    className?: string;
}

function fallbackArtwork(title: string): string {
    return title.toLowerCase().includes("can bus") ? heropic : heropic2;
}

/**
 * Backend thumbnails arrive in mixed shapes (absolute URL, /storage/…,
 * bare relative path, or null). Normalize to a playable URL and always
 * fall back to bundled artwork so production cards never render empty.
 */
export function resolveCourseImage(title: string, image?: string | null): string {
    const fallback = fallbackArtwork(title);
    if (!image) return fallback;
    const value = image.trim();
    if (!value) return fallback;
    if (/^(https?:\/\/|data:|blob:)/i.test(value)) return value;
    const path = value.replace(/^\/+/, "");
    const base = env.storageUrl.replace(/\/+$/, "");
    const relative = path.startsWith("storage/") ? path.slice("storage/".length) : path;
    return `${base}/${relative}`;
}

export function CourseThumbnail({ title, image, video, showMute = false, className = "" }: CourseThumbnailProps) {
    const [muted, setMuted] = useState(true);
    const fallback = fallbackArtwork(title);
    const source = resolveCourseImage(title, image);

    return <div className={`relative aspect-video overflow-hidden bg-[#222] ${className}`}>
        {video ? <video src={video} autoPlay loop muted={muted} playsInline preload="metadata" className="h-full w-full object-cover" aria-label={`${title} preview`} /> : <img src={source} onError={(event) => { if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]" />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />
        {video && showMute && <button type="button" onClick={() => setMuted((value) => !value)} className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-[#F47822]" aria-label={muted ? "Unmute preview" : "Mute preview"}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>}
    </div>;
}
