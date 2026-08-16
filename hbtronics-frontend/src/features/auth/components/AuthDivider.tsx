interface AuthDividerProps {
    label?: string;
}

export function AuthDivider({
    label = "OR",
}: AuthDividerProps) {
    return (
        <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-[10px] font-medium tracking-[0.18em] text-slate-400">
                {label}
            </span>

            <div className="h-px flex-1 bg-slate-200" />
        </div>
    );
}