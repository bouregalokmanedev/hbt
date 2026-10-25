import { Activity, FileText, Settings, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabBuilderCard } from "../../components/lab-builder/LabBuilderCard";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";

export function InstructorOscilloscopeLabBuilderPage() {
    const { t } = useTranslation();

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid="oscilloscope-lab-builder-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="oscilloscope-lab-header"
                    to="/instructor/simulator"
                    backLabel={t("instructor.simulator.oscilloscopeLab.back")}
                    icon={Activity}
                    eyebrow={t("instructor.simulator.oscilloscopeLab.eyebrow")}
                    title={t("instructor.simulator.oscilloscopeLab.title")}
                    description={t("instructor.simulator.oscilloscopeLab.description")}
                    stats={[
                        {
                            label: t("instructor.simulator.oscilloscopeLab.header.builders"),
                            value: 4,
                        },
                    ]}
                />

                <section
                    aria-label={t("instructor.simulator.oscilloscopeLab.title")}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <LabBuilderCard
                        testId="lab-card-scope-exercises"
                        to="/instructor/simulator/oscilloscope/exercises"
                        title={t("instructor.simulator.oscilloscopeLab.cards.exercises.title")}
                        description={t("instructor.simulator.oscilloscopeLab.cards.exercises.desc")}
                        image="/assets/simulator/ref-inj-voltage.png"
                        icon={Activity}
                    />
                    <LabBuilderCard
                        testId="lab-card-scope-faults"
                        to="/instructor/simulator/oscilloscope/faults"
                        title={t("instructor.simulator.oscilloscopeLab.cards.faults.title")}
                        description={t("instructor.simulator.oscilloscopeLab.cards.faults.desc")}
                        image="/assets/simulator/ref-cam-hall.png"
                        icon={Zap}
                    />
                    <LabBuilderCard
                        testId="lab-card-scope-reports"
                        to="/instructor/simulator/oscilloscope/reports"
                        title={t("instructor.simulator.oscilloscopeLab.cards.reports.title")}
                        description={t("instructor.simulator.oscilloscopeLab.cards.reports.desc")}
                        image="/assets/simulator/ref/o2/6.png"
                        icon={FileText}
                    />
                    <LabBuilderCard
                        testId="lab-card-scope-settings"
                        to="/instructor/simulator/oscilloscope/settings"
                        title={t("instructor.simulator.oscilloscopeLab.cards.settings.title")}
                        description={t("instructor.simulator.oscilloscopeLab.cards.settings.desc")}
                        image="/assets/simulator/ref/crank/3.png"
                        icon={Settings}
                    />
                </section>
            </div>
        </main>
    );
}
