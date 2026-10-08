import { GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { UserAvatar } from "@/components/ui";

import type { Course } from "../types/course.types";

type Instructor = NonNullable<Course["instructor"]>;

export function CourseInstructor({ instructor, className = "" }: { instructor?: Instructor | null; className?: string }) {
    const { t } = useTranslation();
    if (!instructor) return null;

    const fullName = `${instructor.first_name} ${instructor.last_name}`.trim();

    return (
        <section className={`rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8 ${className}`}>
            <div className="flex items-start gap-4">
                <UserAvatar
                    user={instructor}
                    className="h-16 w-16 border border-border shadow-sm"
                    fallbackClassName="bg-[#F47822] text-xl font-bold text-white"
                />
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {t("courseDetails.instructor.eyebrow")}
                    </p>
                    <h2 className="mt-1.5 truncate text-xl font-bold tracking-tight text-foreground">{fullName}</h2>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">@{instructor.username}</p>
                </div>
            </div>
            {instructor.bio && (
                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">{instructor.bio}</p>
            )}
        </section>
    );
}
