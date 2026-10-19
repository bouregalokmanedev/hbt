import { FileText, Flag, ScanLine, Settings, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabBuilderCard } from "../../components/lab-builder/LabBuilderCard";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";

export function InstructorScannerLabBuilderPage() {
    const { t } = useTranslation();

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid="scanner-lab-builder-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="scanner-lab-header"
                    to="/instructor/simulator"
                    backLabel={t("instructor.simulator.scannerLab.back")}
                    icon={ScanLine}
                    eyebrow={t("instructor.simulator.scannerLab.eyebrow")}
                    title={t("instructor.simulator.scannerLab.title")}
                    description={t("instructor.simulator.scannerLab.description")}
                    stats={[
                        {
                            label: t("instructor.simulator.scannerLab.header.builders"),
                            value: 4,
                        },
                    ]}
                />

                <section
                    aria-label={t("instructor.simulator.scannerLab.title")}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <LabBuilderCard
                        testId="lab-card-diagnostics"
                        to="/instructor/simulator/scanner/diagnostics"
                        title={t("instructor.simulator.scannerLab.cards.diagnostics.title")}
                        description={t("instructor.simulator.scannerLab.cards.diagnostics.desc")}
                        image="/assets/simulator/detail-T1.png"
                        icon={ScanLine}
                    />
                    <LabBuilderCard
                        testId="lab-card-special-functions"
                        to="/instructor/simulator/scanner/special-functions"
                        title={t("instructor.simulator.scannerLab.cards.specialFunctions.title")}
                        description={t("instructor.simulator.scannerLab.cards.specialFunctions.desc")}
                        image="/assets/simulator/detail-X1.png"
                        icon={Wrench}
                    />
                    <LabBuilderCard
                        testId="lab-card-missions"
                        to="/instructor/simulator/scanner/missions"
                        title={t("instructor.simulator.scannerLab.cards.missions.title")}
                        description={t("instructor.simulator.scannerLab.cards.missions.desc")}
                        image="/assets/simulator/detail-L1.png"
                        icon={Flag}
                    />
                    <LabBuilderCard
                        testId="lab-card-reports"
                        to="/instructor/simulator/scanner/reports"
                        title={t("instructor.simulator.scannerLab.cards.reports.title")}
                        description={t("instructor.simulator.scannerLab.cards.reports.desc")}
                        image="/assets/simulator/detail-L1.png"
                        icon={FileText}
                    />
                    <LabBuilderCard
                        testId="lab-card-settings"
                        to="/instructor/simulator/scanner/settings"
                        title={t("instructor.simulator.scannerLab.cards.settings.title")}
                        description={t("instructor.simulator.scannerLab.cards.settings.desc")}
                        image="/assets/simulator/detail-H3.png"
                        icon={Settings}
                    />
                </section>
            </div>
        </main>
    );
}
