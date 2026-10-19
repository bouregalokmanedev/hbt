import { useTranslation } from "react-i18next";
import { ModalShell } from "./chrome";
import type { DiagnosisBrand, DiagnosisVariant } from "./data";

/* "Confirm vehicle profile" popup shown after Automatic Detection — four
   data rows (VIN / series / year / transmission) with Cancel + OK. */

type Props = {
    brand: DiagnosisBrand;
    variant: DiagnosisVariant;
    onConfirm: () => void;
    onCancel: () => void;
};

export function VehicleProfileModal({ brand, variant, onConfirm, onCancel }: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";

    const rows: { label: string; value: string }[] = [
        { label: t(`${cs}.profileVin`), value: variant.profile.vin },
        { label: t(`${cs}.profileSeries`), value: variant.profile.series },
        { label: t(`${cs}.profileYear`), value: variant.profile.year },
        { label: t(`${cs}.profileTransmission`), value: variant.profile.transmission },
    ];

    return (
        <ModalShell
            title={t(`${cs}.profileTitle`)}
            subtitle={`${brand.name} · ${brand.name === variant.model ? variant.name : `${variant.model} ${variant.name}`}`}
            cancelLabel={t(`${cs}.cancel`)}
            okLabel={t(`${cs}.ok`)}
            onCancel={onCancel}
            onConfirm={onConfirm}
        >
            <div aria-label={`${brand.name} ${variant.name}`}>
                {rows.map((row, i) => (
                    <div
                        key={row.label}
                        className="flex"
                        style={{
                            borderTop: i === 0 ? "none" : "1px solid #e6e8ec",
                            background: i === 0 ? "#f0f2f5" : "#ffffff",
                        }}
                    >
                        <div
                            className="w-[52%] py-[2.2cqw] pe-[2cqw] text-end text-[#3f444c]"
                            style={{
                                fontSize: "1.7cqw",
                                borderInlineEnd: "1px solid #e6e8ec",
                            }}
                        >
                            {row.label}
                        </div>
                        <div
                            className="flex-1 py-[2.2cqw] ps-[2.4cqw] font-semibold text-[#2e8ae6]"
                            style={{ fontSize: "1.7cqw" }}
                        >
                            {row.value}
                        </div>
                    </div>
                ))}
            </div>
        </ModalShell>
    );
}
