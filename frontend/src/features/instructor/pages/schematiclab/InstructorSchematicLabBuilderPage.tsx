import { FileText, GitBranch, ListChecks, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabBuilderCard } from "../../components/lab-builder/LabBuilderCard";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";

export function InstructorSchematicLabBuilderPage() {
    const { t } = useTranslation();

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid="schematic-lab-builder-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="schematic-lab-header"
                    to="/instructor/simulator"
                    backLabel={t("instructor.simulator.schematicLab.back")}
                    icon={GitBranch}
                    eyebrow={t("instructor.simulator.schematicLab.eyebrow")}
                    title={t("instructor.simulator.schematicLab.title")}
                    description={t("instructor.simulator.schematicLab.description")}
                    stats={[
                        {
                            label: t("instructor.simulator.schematicLab.header.builders"),
                            value: 4,
                        },
                    ]}
                />

                <section
                    aria-label={t("instructor.simulator.schematicLab.title")}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <LabBuilderCard
                        testId="lab-card-schematic-diagrams"
                        to="/instructor/simulator/schematic/diagrams"
                        title={t("instructor.simulator.schematicLab.cards.diagrams.title")}
                        description={t("instructor.simulator.schematicLab.cards.diagrams.desc")}
                        image="/assets/simulator/diagram-r16.png"
                        icon={GitBranch}
                    />
                    <LabBuilderCard
                        testId="lab-card-schematic-tasks"
                        to="/instructor/simulator/schematic/tasks"
                        title={t("instructor.simulator.schematicLab.cards.tasks.title")}
                        description={t("instructor.simulator.schematicLab.cards.tasks.desc")}
                        image="/assets/simulator/map-ecu.png"
                        icon={ListChecks}
                    />
                    <LabBuilderCard
                        testId="lab-card-schematic-reports"
                        to="/instructor/simulator/schematic/reports"
                        title={t("instructor.simulator.schematicLab.cards.reports.title")}
                        description={t("instructor.simulator.schematicLab.cards.reports.desc")}
                        image="/assets/simulator/fusebox-location.png"
                        icon={FileText}
                    />
                    <LabBuilderCard
                        testId="lab-card-schematic-settings"
                        to="/instructor/simulator/schematic/settings"
                        title={t("instructor.simulator.schematicLab.cards.settings.title")}
                        description={t("instructor.simulator.schematicLab.cards.settings.desc")}
                        image="/assets/simulator/fusebox-layout.png"
                        icon={Settings}
                    />
                </section>
            </div>
        </main>
    );
}
