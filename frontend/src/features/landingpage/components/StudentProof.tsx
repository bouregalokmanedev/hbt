import {
    ArrowRight,
    Play,
    Volume2,
    VolumeX,
} from "lucide-react";

import {
    useRef,
    useState,
    type MouseEvent,
} from "react";

import { Link } from "react-router-dom";

import studentVideo01 from "@/assets/students/student-01.mp4";
import studentVideo02 from "@/assets/students/student-02.mp4";
import studentVideo03 from "@/assets/students/student-03.mp4";
import studentVideo04 from "@/assets/students/student-04.mp4";

/* ================================================================
   TYPES
================================================================ */

interface StudentVideo {
    id: number;
    video: string;
    label: string;
}

/* ================================================================
   STUDENT VIDEOS
================================================================ */

const studentVideos: StudentVideo[] = [
    {
        id: 1,
        video: studentVideo01,
        label: "DIAGNOSTICS",
    },
    {
        id: 2,
        video: studentVideo02,
        label: "PRACTICAL",
    },
    {
        id: 3,
        video: studentVideo03,
        label: "TRAINING",
    },
    {
        id: 4,
        video: studentVideo04,
        label: "WORKSHOP",
    },
];

/* ================================================================
   VIDEO CARD
================================================================ */

function StudentVideoCard({
    item,
}: {
    item: StudentVideo;
}) {
    const videoRef =
        useRef<HTMLVideoElement | null>(null);

    const [isPlaying, setIsPlaying] =
        useState(false);

    const [isMuted, setIsMuted] =
        useState(true);

    /*
     * ------------------------------------------------------------
     * PLAY / PAUSE
     * ------------------------------------------------------------
     */

    const togglePlayback = async () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        try {
            if (video.paused) {
                await video.play();
                setIsPlaying(true);
            } else {
                video.pause();
                setIsPlaying(false);
            }
        } catch {
            setIsPlaying(false);
        }
    };

    /*
     * ------------------------------------------------------------
     * MUTE / UNMUTE
     * ------------------------------------------------------------
     */

    const toggleMute = (
        event: MouseEvent<HTMLButtonElement>,
    ) => {
        event.stopPropagation();

        const video = videoRef.current;

        if (!video) {
            return;
        }

        video.muted = !video.muted;

        setIsMuted(video.muted);
    };

    return (
        <article className="group relative">
            {/* ====================================================
                VIDEO
            ===================================================== */}

            <div
                className="relative aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-[26px] bg-[#18191A] shadow-[0_12px_40px_rgba(58,58,58,0.08)] transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_22px_55px_rgba(58,58,58,0.14)]"
                onClick={togglePlayback}
            >
                <video
                    ref={videoRef}
                    src={item.video}
                    muted={isMuted}
                    playsInline
                    preload="metadata"
                    loop
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    onPlay={() =>
                        setIsPlaying(true)
                    }
                    onPause={() =>
                        setIsPlaying(false)
                    }
                />

                {/* =================================================
                    OVERLAY
                ================================================== */}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/15" />

                {/* =================================================
                    TOP LABEL
                ================================================== */}

                <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                        <span className="text-[9px] font-bold tracking-[0.14em] text-white/80">
                            {item.label}
                        </span>
                    </div>

                    <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-white/45">
                        0{item.id}
                    </span>
                </div>

                {/* =================================================
                    PLAY BUTTON
                ================================================== */}

                <div
                    className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 ${
                        isPlaying
                            ? "pointer-events-none opacity-0"
                            : "opacity-100"
                    }`}
                >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#3A3A3A] shadow-[0_15px_45px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#F47822] group-hover:text-white">
                        <Play
                            size={21}
                            fill="currentColor"
                            className="ml-1"
                        />
                    </div>
                </div>

                {/* =================================================
                    BOTTOM CONTROLS
                ================================================== */}

                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
                        HBTronics
                    </span>

                    <button
                        type="button"
                        onClick={toggleMute}
                        aria-label={
                            isMuted
                                ? "Unmute video"
                                : "Mute video"
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 backdrop-blur-md transition-all duration-300 hover:border-[#F47822] hover:bg-[#F47822] hover:text-white"
                    >
                        {isMuted ? (
                            <VolumeX
                                size={15}
                                strokeWidth={1.8}
                            />
                        ) : (
                            <Volume2
                                size={15}
                                strokeWidth={1.8}
                            />
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}

/* ================================================================
   MAIN SECTION
================================================================ */

export default function StudentProof() {
    return (
        <section className="relative overflow-hidden bg-[#F7F7F7] py-24 sm:py-28 lg:py-32">
            {/* ====================================================
                SUBTLE BACKGROUND
            ===================================================== */}

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.018]"
                style={{
                    backgroundImage:
                        "linear-gradient(#3A3A3A 1px, transparent 1px), linear-gradient(90deg, #3A3A3A 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                }}
            />

            {/* ====================================================
                MAIN CONTAINER
            ===================================================== */}

            <div className="relative mx-auto max-w-[1500px] px-6 sm:px-8 lg:px-12">
                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        {/* Small label */}

                        <div className="mb-5 flex items-center gap-3">
                            <span className="h-[2px] w-8 bg-[#F47822]" />

                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/45">
                                HBTronics Students
                            </span>
                        </div>

                        {/* Heading */}

                        <h2 className="text-[46px] font-black leading-[0.92] tracking-[-0.045em] text-[#3A3A3A] sm:text-[60px] lg:text-[72px]">
                            SEE IT
                            <br />

                            <span className="text-[#F47822]">
                                IN PRACTICE.
                            </span>
                        </h2>
                    </div>

                    {/* Small description */}

                    <p className="max-w-[330px] text-sm leading-6 text-[#3A3A3A]/50 lg:pb-2">
                        Real students putting their
                        diagnostic skills to work.
                    </p>
                </div>

                {/* =================================================
                    DIVIDER
                ================================================== */}

                <div className="my-10 h-px bg-[#3A3A3A]/10 sm:my-12" />

                {/* =================================================
                    VIDEO GRID
                ================================================== */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {studentVideos.map((item) => (
                        <StudentVideoCard
                            key={item.id}
                            item={item}
                        />
                    ))}
                </div>

                {/* =================================================
                    BOTTOM LINE
                ================================================== */}

                <div className="mt-10 flex flex-col gap-5 border-t border-[#3A3A3A]/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35">
                            Learning by doing
                        </span>
                    </div>

                    <Link
                        to="/register"
                        className="group inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[#3A3A3A]"
                    >
                        <span>
                            Start learning
                        </span>

                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A3A3A]/15 transition-all duration-300 group-hover:border-[#F47822] group-hover:bg-[#F47822] group-hover:text-white">
                            <ArrowRight
                                size={15}
                                strokeWidth={1.8}
                                className="transition-transform duration-300 group-hover:translate-x-0.5"
                            />
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}