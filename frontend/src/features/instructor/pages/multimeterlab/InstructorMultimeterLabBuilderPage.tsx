import { FileText, Flag, Gauge, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabBuilderCard } from "../../components/lab-builder/LabBuilderCard";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";

export function InstructorMultimeterLabBuilderPage() {
    const { t } = useTranslation();

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid="multimeter-lab-builder-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="multimeter-lab-header"
                    to="/instructor/simulator"
                    backLabel={t("instructor.simulator.multimeterLab.back")}
                    icon={Gauge}
                    eyebrow={t("instructor.simulator.multimeterLab.eyebrow")}
                    title={t("instructor.simulator.multimeterLab.title")}
                    description={t("instructor.simulator.multimeterLab.description")}
                    stats={[
                        {
                            label: t("instructor.simulator.multimeterLab.header.builders"),
                            value: 4,
                        },
                    ]}
                />

                <section
                    aria-label={t("instructor.simulator.multimeterLab.title")}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <LabBuilderCard
                        testId="lab-card-measurements"
                        to="/instructor/simulator/multimeter/measurements"
                        title={t("instructor.simulator.multimeterLab.cards.measurements.title")}
                        description={t("instructor.simulator.multimeterLab.cards.measurements.desc")}
                        image="/assets/simulator/detail-L3.png"
                        icon={Gauge}
                    />
                    <LabBuilderCard
                        testId="lab-card-mm-missions"
                        to="/instructor/simulator/multimeter/missions"
                        title={t("instructor.simulator.multimeterLab.cards.missions.title")}
                        description={t("instructor.simulator.multimeterLab.cards.missions.desc")}
                        image="/assets/simulator/detail-L1.png"
                        icon={Flag}
                    />
                    <LabBuilderCard
                        testId="lab-card-mm-reports"
                        to="/instructor/simulator/multimeter/reports"
                        title={t("instructor.simulator.multimeterLab.cards.reports.title")}
                        description={t("instructor.simulator.multimeterLab.cards.reports.desc")}
                        image="/assets/simulator/detail-U2.png"
                        icon={FileText}
                    />
                    <LabBuilderCard
                        testId="lab-card-mm-settings"
                        to="/instructor/simulator/multimeter/settings"
                        title={t("instructor.simulator.multimeterLab.cards.settings.title")}
                        description={t("instructor.simulator.multimeterLab.cards.settings.desc")}
                        image="/assets/simulator/detail-H3.png"
                        icon={Settings}
                    />
                </section>
            </div>
        </main>
    );
}
