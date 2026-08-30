interface StatCardProps {
    label: string;
    value: string | number;
    description?: string;
    icon: React.ReactNode;
}

export function StatCard({
    label,
    value,
    description,
    icon,
}: StatCardProps) {
    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)] transition-shadow hover:shadow-[0_12px_35px_rgba(58,58,58,0.08)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-medium text-[#3A3A3A]/55">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-[11px] text-[#3A3A3A]/45">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                    {icon}
                </div>
            </div>
        </div>
    );
}