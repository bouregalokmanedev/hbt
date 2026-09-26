
import { Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

import { COUNTRIES } from "../constants/countries";

interface ProfilePhoneFieldProps {
    phone: string;
    countryCode: string;
    editable: boolean;
    onPhoneChange: (value: string) => void;
    onCountryCodeChange: (value: string) => void;
}

export function ProfilePhoneField({
    phone,
    countryCode,
    editable,
    onPhoneChange,
    onCountryCodeChange,
}: ProfilePhoneFieldProps) {
    const { t } = useTranslation();

    return (
        <div>
            <label className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#3A3A3A]/40 dark:text-white/40">
                <Phone className="h-3 w-3" />
                {t("profilePage.phone.label")}
            </label>

            {editable ? (
                <div className="flex h-10 overflow-hidden rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] transition focus-within:border-[#F47822]/40 focus-within:ring-2 focus-within:ring-[#F47822]/10">

                    <select
                        value={countryCode}
                        onChange={(event) =>
                            onCountryCodeChange(
                                event.target.value,
                            )
                        }
                        className="w-[92px] shrink-0 border-r border-[#3A3A3A]/8 dark:border-white/8 bg-[#FAFAFA] dark:bg-[#232329] px-2 text-xs text-[#3A3A3A] dark:text-[#ececef] outline-none"
                    >
                        {COUNTRIES.map((country) => (
                            <option
                                key={`${country.code}-${country.dialCode}`}
                                value={country.dialCode}
                            >
                                {country.code}{" "}
                                {country.dialCode}
                            </option>
                        ))}
                    </select>

                    <input
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                            onPhoneChange(
                                event.target.value,
                            )
                        }
                        placeholder={t("profilePage.phone.placeholder")}
                        className="min-w-0 flex-1 px-3 text-xs text-[#3A3A3A] dark:text-[#ececef] outline-none placeholder:text-[#3A3A3A]/30 dark:placeholder:text-white/30"
                    />
                </div>
            ) : (
                <div className="flex min-h-10 items-center rounded-xl border border-[#3A3A3A]/6 dark:border-white/6 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-xs text-[#3A3A3A]/75 dark:text-white/75">
                    {phone
                        ? <span dir="ltr">{`${countryCode} ${phone}`}</span>
                        : t("profilePage.phone.notProvided")}
                </div>
            )}
        </div>
    );
}
