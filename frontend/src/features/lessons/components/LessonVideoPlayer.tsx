
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Captions,
    ChevronLeft,
    ChevronRight,
    Maximize,
    Pause,
    Play,
    Settings2,
    Volume2,
    VolumeX,
} from "lucide-react";

import type {
    Lesson,
    LessonProgress,
} from "../types/lesson.types";

interface LessonVideoPlayerProps {
    lesson: Lesson;
    progress?: LessonProgress | null;
    onProgress?: (
        percentage: number,
        timeSpent: number,
    ) => void;
    onComplete?: () => void;
    onPreviousLesson?: () => void;
    onNextLesson?: () => void;
}

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
        remaining,
    ).padStart(2, "0")}`;
}

export function LessonVideoPlayer({
    lesson,
    progress,
    onProgress,
    onComplete,
    onPreviousLesson,
    onNextLesson,
}: LessonVideoPlayerProps) {
    const videoRef =
        useRef<HTMLVideoElement | null>(null);

    /**
     * Prevent saved progress from being applied
     * again every time the parent updates progress.
     */
    const hasRestoredProgress =
        useRef(false);

    /**
     * Used to prevent backend progress updates
     * while the user is actively seeking.
     */
    const isSeeking =
        useRef(false);

    /**
     * Prevent duplicate completion calls.
     */
    const hasCompleted =
        useRef(false);

    /**
     * Last time progress was sent to the backend.
     */
    const lastSavedTime =
        useRef(0);

    const [
        isPlaying,
        setIsPlaying,
    ] = useState(false);

    const [
        currentTime,
        setCurrentTime,
    ] = useState(0);

    const [
        duration,
        setDuration,
    ] = useState(0);

    const [
        isMuted,
        setIsMuted,
    ] = useState(false);

    /**
     * Saved volume.
     *
     * Volume is stored between 0 and 1.
     */
    const [volume, setVolume] = useState(() => {
        if (typeof window === "undefined") {
            return 1;
        }

        const savedVolume =
            window.localStorage.getItem(
                "lesson-video-volume",
            );

        if (savedVolume === null) {
            return 1;
        }

        const parsedVolume =
            Number(savedVolume);

        if (!Number.isFinite(parsedVolume)) {
            return 1;
        }

        return Math.min(
            1,
            Math.max(0, parsedVolume),
        );
    });

    /**
     * Previous non-zero volume.
     *
     * Used when unmuting.
     */
    const previousVolume =
        useRef(volume > 0 ? volume : 1);

    const [
        isFullscreen,
        setIsFullscreen,
    ] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    /**
     * Find the lesson video.
     */
    const video = lesson.media?.find(
        (media) =>
            media.type === "video" ||
            media.mime_type.startsWith("video/"),
    );

    /**
     * Extract captions URL.
     *
     * IMPORTANT:
     * This must be declared before any hook
     * or JSX that uses captionsUrl.
     */
    const captionsUrl =
        video?.metadata &&
        typeof video.metadata === "object" &&
        "captions_url" in video.metadata &&
        typeof (
            video.metadata as {
                captions_url?: unknown;
            }
        ).captions_url === "string"
            ? (
                  video.metadata as {
                      captions_url: string;
                  }
              ).captions_url
            : null;

    /**
     * Captions enabled state.
     */
    const [
        captionsEnabled,
        setCaptionsEnabled,
    ] = useState(() => {
        if (typeof window === "undefined") {
            return true;
        }

        const saved =
            window.localStorage.getItem(
                "lesson-video-captions",
            );

        return saved === null
            ? true
            : saved === "true";
    });

    /**
     * Keep the actual HTML video volume
     * synchronized with React state.
     */
    useEffect(() => {
        const videoElement =
            videoRef.current;

        if (!videoElement) {
            return;
        }

        videoElement.volume = volume;

        if (volume > 0) {
            previousVolume.current =
                volume;
        }

        if (volume === 0) {
            videoElement.muted = true;
            setIsMuted(true);
        }
    }, [volume]);

    /**
     * Restore saved progress ONLY ONCE.
     *
     * Important:
     * We do NOT depend on progress.time_spent
     * alone to reset the video position.
     */
    useEffect(() => {
        const videoElement =
            videoRef.current;

        if (
            !videoElement ||
            hasRestoredProgress.current ||
            !progress
        ) {
            return;
        }

        const savedTime =
            Number(progress.time_spent ?? 0);

        if (
            savedTime > 0 &&
            Number.isFinite(savedTime)
        ) {
            /**
             * If metadata is already loaded,
             * restore immediately.
             *
             * Otherwise handleLoadedMetadata
             * will restore it later.
             */
            if (
                Number.isFinite(
                    videoElement.duration,
                ) &&
                videoElement.duration > 0
            ) {
                const safeTime =
                    Math.min(
                        savedTime,
                        videoElement.duration,
                    );

                videoElement.currentTime =
                    safeTime;

                setCurrentTime(
                    safeTime,
                );

                hasRestoredProgress.current =
                    true;
            }
        } else {
            hasRestoredProgress.current =
                true;
        }
    }, [progress]);

    /**
     * Reset state when lesson changes.
     */
    useEffect(() => {
        hasRestoredProgress.current =
            false;

        hasCompleted.current =
            false;

        isSeeking.current =
            false;

        lastSavedTime.current =
            0;

        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
    }, [lesson.id]);

    /**
     * Video metadata loaded.
     */
    const handleLoadedMetadata =
        useCallback(
            (
                event: React.SyntheticEvent<HTMLVideoElement>,
            ) => {
                const videoElement =
                    event.currentTarget;

                const videoDuration =
                    videoElement.duration;

                if (
                    Number.isFinite(
                        videoDuration,
                    ) &&
                    videoDuration > 0
                ) {
                    setDuration(
                        videoDuration,
                    );
                }

                /**
                 * Restore saved progress here if
                 * metadata was not available earlier.
                 */
                if (
                    !hasRestoredProgress.current
                ) {
                    const savedTime =
                        Number(
                            progress?.time_spent ??
                                0,
                        );

                    if (
                        savedTime > 0 &&
                        Number.isFinite(
                            savedTime,
                        )
                    ) {
                        const safeTime =
                            Math.min(
                                savedTime,
                                videoDuration,
                            );

                        videoElement.currentTime =
                            safeTime;

                        setCurrentTime(
                            safeTime,
                        );
                    }

                    hasRestoredProgress.current =
                        true;
                }
            },
            [progress?.time_spent],
        );

    /**
     * Time update from the actual video.
     */
    const handleTimeUpdate =
        useCallback(
            (
                event: React.SyntheticEvent<HTMLVideoElement>,
            ) => {
                const videoElement =
                    event.currentTarget;

                const time =
                    videoElement.currentTime;

                const videoDuration =
                    videoElement.duration;

                setCurrentTime(time);

                /**
                 * Do not save progress while
                 * actively seeking.
                 */
                if (isSeeking.current) {
                    return;
                }

                if (
                    !Number.isFinite(
                        videoDuration,
                    ) ||
                    videoDuration <= 0
                ) {
                    return;
                }

                /**
                 * Save every 5 seconds.
                 */
                if (
                    time -
                        lastSavedTime.current >=
                    5
                ) {
                    lastSavedTime.current =
                        time;

                    const percentage =
                        Math.min(
                            100,
                            Math.round(
                                (time /
                                    videoDuration) *
                                    100,
                            ),
                        );

                    onProgress?.(
                        percentage,
                        Math.floor(time),
                    );
                }
            },
            [onProgress],
        );

    /**
     * Video ended.
     */
    const handleEnded =
        useCallback(() => {
            const videoElement =
                videoRef.current;

            const finalDuration =
                videoElement?.duration ??
                duration;

            setCurrentTime(
                finalDuration,
            );

            setIsPlaying(false);

            if (!hasCompleted.current) {
                hasCompleted.current =
                    true;

                onProgress?.(
                    100,
                    Math.floor(
                        finalDuration,
                    ),
                );

                onComplete?.();
            }
        }, [
            duration,
            onComplete,
            onProgress,
        ]);

    /**
     * Play / pause.
     */
    const togglePlay =
        useCallback(() => {
            const videoElement =
                videoRef.current;

            if (!videoElement) {
                return;
            }

            if (videoElement.paused) {
                void videoElement.play();
            } else {
                videoElement.pause();
            }
        }, []);

    /**
     * NEW:
     * Clicking anywhere on the video area
     * toggles play / pause.
     *
     * Controls below the video are not affected.
     */
    const handleVideoClick =
        useCallback(() => {
            togglePlay();
        }, [togglePlay]);

    /**
     * Start seeking.
     */
    const handleSeekStart =
        useCallback(() => {
            isSeeking.current =
                true;
        }, []);

    /**
     * Seek using range slider.
     */
    const handleSeek =
        useCallback(
            (
                event: React.ChangeEvent<HTMLInputElement>,
            ) => {
                const videoElement =
                    videoRef.current;

                if (!videoElement) {
                    return;
                }

                const value =
                    Number(
                        event.target.value,
                    );

                if (
                    !Number.isFinite(
                        value,
                    )
                ) {
                    return;
                }

                const safeValue =
                    Math.max(
                        0,
                        Math.min(
                            value,
                            videoElement.duration ||
                                duration ||
                                0,
                        ),
                    );

                videoElement.currentTime =
                    safeValue;

                setCurrentTime(
                    safeValue,
                );
            },
            [duration],
        );

    /**
     * Finish seeking.
     */
    const handleSeekEnd =
        useCallback(() => {
            const videoElement =
                videoRef.current;

            isSeeking.current =
                false;

            if (!videoElement) {
                return;
            }

            const time =
                videoElement.currentTime;

            const videoDuration =
                videoElement.duration;

            if (
                !Number.isFinite(
                    videoDuration,
                ) ||
                videoDuration <= 0
            ) {
                return;
            }

            lastSavedTime.current =
                time;

            const percentage =
                Math.min(
                    100,
                    Math.round(
                        (time /
                            videoDuration) *
                            100,
                    ),
                );

            onProgress?.(
                percentage,
                Math.floor(time),
            );
        }, [onProgress]);

    /**
     * Mute / unmute.
     *
     * When unmuting, restore the previous
     * non-zero volume.
     */
    const toggleMute =
        useCallback(() => {
            const videoElement =
                videoRef.current;

            if (!videoElement) {
                return;
            }

            if (
                videoElement.muted ||
                videoElement.volume === 0
            ) {
                const restoredVolume =
                    previousVolume.current > 0
                        ? previousVolume.current
                        : 1;

                videoElement.volume =
                    restoredVolume;

                videoElement.muted =
                    false;

                setVolume(
                    restoredVolume,
                );

                setIsMuted(false);

                window.localStorage.setItem(
                    "lesson-video-volume",
                    String(
                        restoredVolume,
                    ),
                );

                return;
            }

            previousVolume.current =
                videoElement.volume;

            videoElement.muted =
                true;

            setIsMuted(true);
        }, []);

    /**
     * Change video volume.
     */
    const handleVolumeChange =
        useCallback(
            (
                event: React.ChangeEvent<HTMLInputElement>,
            ) => {
                const videoElement =
                    videoRef.current;

                if (!videoElement) {
                    return;
                }

                const nextVolume =
                    Math.min(
                        1,
                        Math.max(
                            0,
                            Number(
                                event.target.value,
                            ),
                        ),
                    );

                if (
                    !Number.isFinite(
                        nextVolume,
                    )
                ) {
                    return;
                }

                videoElement.volume =
                    nextVolume;

                if (nextVolume === 0) {
                    videoElement.muted =
                        true;

                    setIsMuted(true);
                } else {
                    videoElement.muted =
                        false;

                    previousVolume.current =
                        nextVolume;

                    setIsMuted(false);
                }

                setVolume(
                    nextVolume,
                );

                window.localStorage.setItem(
                    "lesson-video-volume",
                    String(nextVolume),
                );
            },
            [],
        );

    /**
     * Enable / disable captions.
     */
    const toggleCaptions =
        useCallback(() => {
            const videoElement =
                videoRef.current;

            if (!videoElement) {
                return;
            }

            const nextEnabled =
                !captionsEnabled;

            const tracks =
                videoElement.textTracks;

            for (
                let index = 0;
                index < tracks.length;
                index += 1
            ) {
                tracks[index].mode =
                    nextEnabled
                        ? "showing"
                        : "hidden";
            }

            setCaptionsEnabled(
                nextEnabled,
            );

            window.localStorage.setItem(
                "lesson-video-captions",
                String(nextEnabled),
            );
        }, [captionsEnabled]);

    const changePlaybackRate = (rate: number) => {
        if (videoRef.current) videoRef.current.playbackRate = rate;
        setPlaybackRate(rate);
    };

    /**
     * Keep captions synchronized with
     * the actual video text tracks.
     */
    useEffect(() => {
        const videoElement =
            videoRef.current;

        if (!videoElement) {
            return;
        }

        const tracks =
            videoElement.textTracks;

        for (
            let index = 0;
            index < tracks.length;
            index += 1
        ) {
            tracks[index].mode =
                captionsEnabled
                    ? "showing"
                    : "hidden";
        }
    }, [
        captionsEnabled,
        captionsUrl,
    ]);

    /**
     * Fullscreen.
     */
    const toggleFullscreen =
        useCallback(async () => {
            const videoElement =
                videoRef.current;

            if (!videoElement) {
                return;
            }

            try {
                if (
                    document.fullscreenElement
                ) {
                    await document.exitFullscreen();
                    return;
                }

                await videoElement.requestFullscreen();
            } catch (error) {
                console.error(
                    "Fullscreen error:",
                    error,
                );
            }
        }, []);

    /**
     * Keep fullscreen state synchronized
     * with the browser.
     */
    useEffect(() => {
        const handleFullscreenChange =
            () => {
                setIsFullscreen(
                    Boolean(
                        document.fullscreenElement,
                    ),
                );
            };

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange,
        );

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
        };
    }, []);

    /**
     * Keyboard controls.
     *
     * Space = play/pause
     * ArrowLeft = -5 seconds
     * ArrowRight = +5 seconds
     */
    const handleKeyDown =
        useCallback(
            (
                event: React.KeyboardEvent<HTMLDivElement>,
            ) => {
                const videoElement =
                    videoRef.current;

                if (!videoElement) {
                    return;
                }

                if (
                    event.key === " "
                ) {
                    event.preventDefault();

                    togglePlay();

                    return;
                }

                if (
                    event.key ===
                    "ArrowLeft"
                ) {
                    event.preventDefault();

                    videoElement.currentTime =
                        Math.max(
                            0,
                            videoElement.currentTime -
                                5,
                        );

                    setCurrentTime(
                        videoElement.currentTime,
                    );

                    return;
                }

                if (
                    event.key ===
                    "ArrowRight"
                ) {
                    event.preventDefault();

                    videoElement.currentTime =
                        Math.min(
                            videoElement.duration ||
                                duration,
                            videoElement.currentTime +
                                5,
                        );

                    setCurrentTime(
                        videoElement.currentTime,
                    );
                }
            },
            [duration, togglePlay],
        );

    if (!video) {
        return (
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-black text-white">
                <div className="text-center">
                    <div className="text-4xl">
                        🎬
                    </div>

                    <p className="mt-3 text-sm text-white/70">
                        No video available for
                        this lesson.
                    </p>
                </div>
            </div>
        );
    }

    const percentage =
        duration > 0
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      (currentTime /
                          duration) *
                          100,
                  ),
              )
            : 0;

    return (
        <div
            className="group relative overflow-hidden rounded-2xl bg-black shadow-2xl"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {/* Video */}
            <div
                className="group relative aspect-video bg-black"
                onClick={handleVideoClick}
            >
                <video
                    ref={videoRef}
                    className="h-full w-full object-contain"
                    preload="metadata"
                    playsInline
                    controls={false}
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    muted={isMuted}
                    onContextMenu={(event) => event.preventDefault()}
                    onLoadedMetadata={
                        handleLoadedMetadata
                    }
                    onTimeUpdate={
                        handleTimeUpdate
                    }
                    onPlay={() =>
                        setIsPlaying(true)
                    }
                    onPause={() =>
                        setIsPlaying(false)
                    }
                    onEnded={
                        handleEnded
                    }
                >
                    <source
                        src={video.url}
                        type={
                            video.mime_type
                        }
                    />

                    {captionsUrl && (
                        <track
                            kind="captions"
                            src={
                                captionsUrl
                            }
                            srcLang="en"
                            label="English"
                            default={
                                captionsEnabled
                            }
                        />
                    )}

                    Your browser does not
                    support HTML video.
                </video>

                <div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between sm:inset-x-4">
                    <button
                        type="button"
                        disabled={!onPreviousLesson}
                        onClick={(event) => {
                            event.stopPropagation();
                            onPreviousLesson?.();
                        }}
                        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white opacity-100 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-[#F47822] sm:h-11 sm:w-11 sm:opacity-0 sm:group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
                        aria-label="Previous lesson"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        disabled={!onNextLesson}
                        onClick={(event) => {
                            event.stopPropagation();
                            onNextLesson?.();
                        }}
                        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white opacity-100 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-[#F47822] sm:h-11 sm:w-11 sm:opacity-0 sm:group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
                        aria-label="Next lesson"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {/* Center Play Button */}
                {!isPlaying && (
                    <button
                        type="button"
                        onClick={(event) => {
                            /**
                             * Prevent the click from
                             * bubbling to the video
                             * container.
                             *
                             * Otherwise the button would
                             * toggle twice.
                             */
                            event.stopPropagation();
                            togglePlay();
                        }}
                        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F47822] text-white shadow-xl transition hover:scale-105 hover:bg-[#e86c18]"
                        aria-label="Play video"
                    >
                        <Play className="ml-1 h-7 w-7 fill-current" />
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-3.5 pt-14 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 max-sm:pointer-events-auto max-sm:opacity-100">
                {/* Seek slider */}
                <input
                    type="range"
                    min={0}
                    max={
                        duration > 0
                            ? duration
                            : 0
                    }
                    step={0.01}
                    value={Math.min(
                        currentTime,
                        duration ||
                            currentTime,
                    )}
                    onMouseDown={
                        handleSeekStart
                    }
                    onTouchStart={
                        handleSeekStart
                    }
                    onChange={
                        handleSeek
                    }
                    onMouseUp={
                        handleSeekEnd
                    }
                    onTouchEnd={
                        handleSeekEnd
                    }
                    disabled={
                        duration <= 0
                    }
                    className="mb-3.5 h-1.5 w-full cursor-pointer accent-[#F47822]"
                    aria-label="Seek video"
                />

                <div className="flex items-center gap-2 text-white sm:gap-3">
                    {/* Play / Pause */}
                    <button
                        type="button"
                        onClick={
                            togglePlay
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#F3F3F3] transition duration-150 hover:bg-[#F3F3F3] hover:text-[#3A3A3A] focus-visible:bg-[#F3F3F3] focus-visible:text-[#3A3A3A] ${isPlaying ? "bg-[#F47822] text-white hover:bg-[#F3F3F3]" : "bg-white/10"}`}
                        aria-label={
                            isPlaying
                                ? "Pause"
                                : "Play"
                        }
                    >
                        {isPlaying ? (
                            <Pause className="h-5 w-5" />
                        ) : (
                            <Play className="h-5 w-5" />
                        )}
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={
                                toggleMute
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#F3F3F3] transition duration-150 hover:bg-[#F3F3F3] hover:text-[#3A3A3A] focus-visible:bg-[#F3F3F3] focus-visible:text-[#3A3A3A] ${isMuted ? "bg-[#F47822] text-white" : "bg-white/10"}`}
                            aria-label={
                                isMuted ||
                                volume === 0
                                    ? "Unmute"
                                    : "Mute"
                            }
                        >
                            {isMuted ||
                            volume === 0 ? (
                                <VolumeX className="h-5 w-5" />
                            ) : (
                                <Volume2 className="h-5 w-5" />
                            )}
                        </button>

                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={
                                isMuted
                                    ? 0
                                    : volume
                            }
                            onChange={
                                handleVolumeChange
                            }
                            className="hidden w-20 cursor-pointer accent-[#F47822] sm:block"
                            aria-label="Volume"
                        />
                    </div>

                    {/* Time */}
                    <span className="ml-1 whitespace-nowrap text-[11px] font-medium text-white/80">
                        {formatTime(
                            currentTime,
                        )}{" "}
                        /{" "}
                        {formatTime(
                            duration,
                        )}
                    </span>

                    {/* Progress + Fullscreen */}
                    <div className="ml-auto flex items-center gap-2">
                        <div className="relative">
                            <button type="button" onClick={() => setSettingsOpen((open) => !open)} className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#F3F3F3] transition duration-150 hover:bg-[#F3F3F3] hover:text-[#3A3A3A] focus-visible:bg-[#F3F3F3] focus-visible:text-[#3A3A3A] ${settingsOpen ? "bg-[#F47822] text-white" : "bg-white/10"}`} aria-label="Player settings" aria-expanded={settingsOpen}><Settings2 className="h-4.5 w-4.5" /></button>
                            {settingsOpen && <div className="absolute bottom-11 right-0 w-52 overflow-hidden rounded-xl border border-white/15 bg-[#171717]/95 p-2 text-xs shadow-2xl backdrop-blur-md"><p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-white/45">Playback speed</p><div className="grid grid-cols-4 gap-1 px-1">{[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => <button key={rate} type="button" onClick={() => changePlaybackRate(rate)} className={`rounded-md px-1.5 py-1.5 text-[10px] font-semibold ${playbackRate === rate ? "bg-[#F47822] text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{rate}×</button>)}</div><div className="mt-2 border-t border-white/10 pt-2"><button type="button" disabled={!captionsUrl} onClick={toggleCaptions} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-white/75 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"><span className="flex items-center gap-2"><Captions className="h-4 w-4"/>Captions</span><span className="text-[10px]">{captionsEnabled && captionsUrl ? "On" : "Off"}</span></button><div className="flex items-center justify-between px-2 py-2 text-white/75"><span>Quality</span><span className="text-[10px]">Auto</span></div></div></div>}
                        </div>

                        <button
                            type="button"
                            onClick={
                                toggleFullscreen
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#F3F3F3] transition duration-150 hover:bg-[#F3F3F3] hover:text-[#3A3A3A] focus-visible:bg-[#F3F3F3] focus-visible:text-[#3A3A3A] ${isFullscreen ? "bg-[#F47822] text-white" : "bg-white/10"}`}
                            aria-label={
                                isFullscreen
                                    ? "Exit fullscreen"
                                    : "Fullscreen"
                            }
                        >
                            <Maximize className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
