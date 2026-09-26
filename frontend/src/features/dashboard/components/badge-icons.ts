import {
    BookOpen,
    Compass,
    Crown,
    Crosshair,
    Flame,
    FlaskConical,
    GraduationCap,
    Map,
    Medal,
    Puzzle,
    Rocket,
    Star,
    Stethoscope,
    ThumbsUp,
    TrendingUp,
    Trophy,
    UserPlus,
    UserRound,
    Wrench,
    Zap,
    type LucideProps,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type IconComponent = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

/**
 * One icon per badge, chosen for the goal the student has to reach.
 */
const BADGE_ICONS: Record<string, IconComponent> = {
    member: UserPlus, // create a learning account
    pro: Crown, // active HBT Pro plan
    striker: Zap, // pass an assessment first try
    elite: Star, // score 90% or more
    learner: BookOpen, // complete your first course
    owner: UserRound, // complete your profile
    pathfinder: Map, // complete three courses
    scholar: GraduationCap, // pass five quizzes
    consistent: Flame, // learn on seven different days
    trailblazer: Rocket, // finish a course within 14 days
    mentor: ThumbsUp, // share ten helpful reviews
    precision: Crosshair, // score 100% on an assessment
    explorer: Compass, // open five different lessons
    "diagnostic-starter": Stethoscope, // finish your first scenario
    "diagnostic-solver": Puzzle, // pass five scenarios
    "bench-starter": Wrench, // finish your first bench
    "sim-explorer": FlaskConical, // try all five labs
    "bench-ace": Medal, // score 90%+ in a bench
    "rising-star": TrendingUp, // earn three badges
};

const KEYWORD_ICONS: Array<[string[], IconComponent]> = [
    [["striker", "assessment", "exam"], Zap],
    [["elite", "90", "score"], Star],
    [["learner", "course", "complete"], BookOpen],
    [["owner", "profile"], UserRound],
    [["member", "account", "join"], UserPlus],
    [["pro", "plan", "subscription"], Crown],
    [["streak", "consisten", "day"], Flame],
    [["quiz", "knowledge", "scholar"], GraduationCap],
    [["master", "expert"], Trophy],
    [["diagnostic", "scenario"], Stethoscope],
    [["bench", "sim", "lab"], Wrench],
    [["path", "explor"], Compass],
];

/**
 * Distinct accent colour per badge so every tile reads as its own award.
 */
const BADGE_ACCENTS: Record<string, string> = {
    member: "#2563EB",
    pro: "#7C3AED",
    striker: "#F43F5E",
    elite: "#F59E0B",
    learner: "#059669",
    owner: "#0EA5E9",
    pathfinder: "#4F46E5",
    scholar: "#0D9488",
    consistent: "#F47822",
    trailblazer: "#DB2777",
    mentor: "#65A30D",
    precision: "#DC2626",
    explorer: "#0891B2",
    "diagnostic-starter": "#F97316",
    "diagnostic-solver": "#9333EA",
    "bench-starter": "#64748B",
    "sim-explorer": "#14B8A6",
    "bench-ace": "#B45309",
    "rising-star": "#EAB308",
};

export function badgeAccent(id?: string): string {
    return (id && BADGE_ACCENTS[id]) || "#F47822";
}

export function resolveBadgeIcon(id?: string, title?: string): IconComponent {
    if (id && BADGE_ICONS[id]) {
        return BADGE_ICONS[id];
    }

    const key = `${title ?? ""}`.toLowerCase().trim();

    if (key) {
        const slug = key.replace(/[^a-z0-9]+/g, "-");
        const bySlug = BADGE_ICONS[slug];

        if (bySlug) {
            return bySlug;
        }

        const byKeyword = KEYWORD_ICONS.find(([keywords]) =>
            keywords.some((word) => key.includes(word)),
        );

        if (byKeyword) {
            return byKeyword[1];
        }
    }

    return Medal;
}

