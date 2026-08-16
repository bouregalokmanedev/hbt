interface EnrollmentButtonProps {
    isEnrolled: boolean;
    isEnrolling: boolean;
    onEnroll: () => void;
}

export function EnrollmentButton({
    isEnrolled,
    isEnrolling,
    onEnroll,
}: EnrollmentButtonProps) {
    if (isEnrolled) {
        return (
            <button
                type="button"
                className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
                Start learning →
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
                ? "Enrolling..."
                : "Enroll now"}
        </button>
    );
}