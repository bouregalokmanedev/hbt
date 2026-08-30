import {
    useEffect,
    useRef,
} from "react";

import type {
    Lesson,
} from "../types/lesson.types";

interface LessonPlayerProps {
    lesson: Lesson;
    onProgress: (
        currentTime: number,
        duration: number,
    ) => void;
    onComplete: () => void;
}

export function LessonPlayer({
    lesson,
    onProgress,
    onComplete,
}: LessonPlayerProps) {
    const videoRef =
        useRef<HTMLVideoElement | null>(
            null,
        );

    const lastSentTime =
        useRef(0);

    const video = lesson.media.find(
        (media) =>
            media.type === "video" ||
            media.mime_type.startsWith(
                "video/",
            ),
    );

    useEffect(() => {
        lastSentTime.current = 0;
    }, [lesson.id]);

    if (!video) {
        return (
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-black">
                <div className="text-center text-white">
                    <p className="text-lg font-semibold">
                        No video available
                    </p>

                    <p className="mt-1 text-sm text-white/60">
                        This lesson does not have
                        a video yet.
                    </p>
                </div>
            </div>
        );
    }

    function handleTimeUpdate() {
        const element =
            videoRef.current;

        if (!element) {
            return;
        }

        const duration =
            element.duration;

        const currentTime =
            element.currentTime;

        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            return;
        }

        const percentage =
            (currentTime / duration) *
            100;

        if (
            currentTime -
                lastSentTime.current >=
            5
        ) {
            lastSentTime.current =
                currentTime;

            onProgress(
                currentTime,
                duration,
            );
        }

        if (percentage >= 90) {
            onComplete();
        }
    }

    function handleEnded() {
        const element =
            videoRef.current;

        if (!element) {
            return;
        }

        onProgress(
            element.duration,
            element.duration,
        );

        onComplete();
    }

    return (
        <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
            <video
                ref={videoRef}
                key={lesson.id}
                className="aspect-video w-full"
                controls
                playsInline
                preload="metadata"
                src={video.url}
                onTimeUpdate={
                    handleTimeUpdate
                }
                onEnded={handleEnded}
            />
        </div>
    );
}