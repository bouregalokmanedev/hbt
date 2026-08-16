export interface CurriculumLesson {
    id: string;
    title: string;
    slug?: string | null;
    description?: string | null;
    duration_minutes: number;
    is_preview: boolean;
    status?: string;
}

export interface CurriculumSection {
    id: string;
    title: string;
    description?: string | null;
    position: number;
    lessons: CurriculumLesson[];
}

export interface CourseCurriculum {
    id: string;
    title: string;
    sections: CurriculumSection[];
}