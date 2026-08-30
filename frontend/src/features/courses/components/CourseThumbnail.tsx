import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import heropic from "@/assets/landing/heropic.jpg";
import heropic2 from "@/assets/landing/heropic2.jpg";

interface CourseThumbnailProps {
    title: string;
    image?: string | null;
    video?: string | null;
    showMute?: boolean;
    className?: string;
}

export function resolveCourseImage(title: string, image?: string | null): string {
    return image || (title.toLowerCase().includes("can bus") ? heropic : heropic2);
}

export function CourseThumbnail({ title, image, video, showMute = false, className = "" }: CourseThumbnailProps) {
    const [muted, setMuted] = useState(true);
    const fallback = resolveCourseImage(title, image);

    return <div className={`relative aspect-video overflow-hidden bg-[#222] ${className}`}>
        {video ? <video src={video} autoPlay loop muted={muted} playsInline preload="metadata" className="h-full w-full object-cover" aria-label={`${title} preview`} /> : <img src={fallback} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]" />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />
        {video && showMute && <button type="button" onClick={() => setMuted((value) => !value)} className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-[#F47822]" aria-label={muted ? "Unmute preview" : "Mute preview"}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>}
    </div>;
}
