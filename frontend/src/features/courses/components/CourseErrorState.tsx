interface CourseErrorStateProps {
    message: string;
    onRetry: () => void;
}

export function CourseErrorState({
    message,
    onRetry,
}: CourseErrorStateProps) {
    return (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <h3 className="text-lg font-semibold">
                Unable to load courses
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
                Try again
            </button>
        </div>
    );
}