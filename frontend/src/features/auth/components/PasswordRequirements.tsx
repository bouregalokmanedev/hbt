import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface PasswordRequirement {
    label: string;
    met: boolean;
}

export function getPasswordRequirements(
    password: string,
    t: (key: string) => string = (key) => key,
): PasswordRequirement[] {
    return [
        { label: t("passwordReq.req8"), met: password.length >= 8 },
        { label: t("passwordReq.reqUpper"), met: /[A-Z]/.test(password) },
        { label: t("passwordReq.reqNumber"), met: /\d/.test(password) },
        { label: t("passwordReq.reqSymbol"), met: /[^A-Za-z0-9]/.test(password) },
    ];
}

export function isStrongPassword(password: string): boolean {
    return getPasswordRequirements(password).every((requirement) => requirement.met);
}

interface PasswordRequirementsProps {
    password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
    const { t } = useTranslation();
    const requirements = getPasswordRequirements(password, t);
    const isComplete = password.length > 0 && requirements.every((requirement) => requirement.met);

    return (
        <div className={`rounded-xl border px-3.5 py-3 transition-colors ${isComplete ? "border-emerald-200 bg-emerald-50/60" : "border-[#3A3A3A]/8 bg-[#FAFAFA]"}`} aria-live="polite">
            <p className={`text-xs font-semibold ${isComplete ? "text-emerald-700" : "text-[#3A3A3A]/70"}`}>
                {isComplete ? t("passwordReq.strong") : t("passwordReq.useStrong")}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {requirements.map((requirement) => (
                    <div key={requirement.label} className={`flex items-center gap-1.5 text-[11px] ${requirement.met ? "text-emerald-700" : "text-[#3A3A3A]/45"}`}>
                        {requirement.met ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} /> : <X className="h-3.5 w-3.5 shrink-0" />}
                        <span>{requirement.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
