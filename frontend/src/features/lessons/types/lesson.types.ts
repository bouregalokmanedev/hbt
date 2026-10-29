export interface LessonProgress {
    id: string;
    lesson_id: string;
    progress_percentage: number;
    time_spent: number;
    started_at: string | null;
    completed_at: string | null;
    is_completed: boolean;
    /** Resume position in seconds (not accumulated watch time). */
    video_position?: number | null;
    last_position?: number | null;
}

export interface LessonMedia {
    id: string;
    original_name: string;
    filename: string;
    mime_type: string;
    extension: string | null;
    size: number;
    type: string;
    disk: string;
    path: string;
    url: string;
    mediable_type: string;
    mediable_id: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

export interface Lesson {
    id: string;

    course_id: string;
    section_id: string;

    title: string;
    slug: string;

    description: string | null;
    content: string | null;

    position: number;
    status: string;

    duration_minutes: number;
    is_preview: boolean;

    media: LessonMedia[];

    progress?: LessonProgress | null;
}

