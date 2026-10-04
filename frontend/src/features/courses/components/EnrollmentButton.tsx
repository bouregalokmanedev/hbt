import { useTranslation } from "react-i18next";

interface EnrollmentButtonProps {
    isEnrolled: boolean;
    isEnrolling: boolean;
    onEnroll: () => void;
    onStart?: () => void;
}

export function EnrollmentButton({
    isEnrolled,
    isEnrolling,
    onEnroll,
    onStart,
}: EnrollmentButtonProps) {
    const { t } = useTranslation();

    if (isEnrolled) {
        return (
            <button
                type="button"
                onClick={onStart}
                className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
                {t("common.startLearning")}{" "}
                <span aria-hidden="true" className="rtl:-scale-x-100">
                    →
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onEnroll}
            disabled={isEnrolling}
            className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
            {isEnrolling
                ? t("courseDetails.page.cta.enrolling")
                : t("common.enrollNow")}
        </button>
    );
}