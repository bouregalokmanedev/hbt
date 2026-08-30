import {
    Award, BookOpen, Crown, Medal, ShieldCheck, Sparkles, Star, Target, Trophy, UserRound, Zap, type LucideProps,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type IconComponent = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

const icons: Array<[string[], IconComponent]> = [
    [["striker", "assessment", "exam"], Target],
    [["elite", "90", "score"], Crown],
    [["learner", "course", "complete"], BookOpen],
    [["owner", "profile"], UserRound],
    [["member", "account", "join"], Star],
    [["pro", "plan", "subscription"], Zap],
    [["streak", "consisten"], Sparkles],
    [["quiz", "knowledge"], Award],
    [["master", "expert"], Trophy],
];

export function BadgeIcon({ title, icon, locked = false, ...props }: LucideProps & { title?: string; icon?: string; locked?: boolean }) {
    const key = `${title ?? ""} ${icon ?? ""}`.toLowerCase();
    const Icon = locked ? ShieldCheck : (icons.find(([keywords]) => keywords.some((word) => key.includes(word)))?.[1] ?? Medal);
    return <Icon {...props} />;
}
