import type {
    RouteObject,
} from "react-router-dom";
import { Navigate } from "react-router-dom";

import {
    AuthGuard,
    RoleGuard,
} from "@/features/auth";

import {
    InstructorLayout,
} from "@/layouts/instructor/InstructorLayout";
import { MessagesPage } from "@/features/messages/pages/MessagesPage";
import { staffHubRoutes } from "@/features/staff-hub/routes";

export const instructorRoutes: RouteObject[] = [
    {
        element: <AuthGuard />,
        children: [
            {
                element: (
                    <RoleGuard
                        roles={[
                            "Instructor",
                        ]}
                    />
                ),
                children: [
                    {
                        element:
                            <InstructorLayout />,
                        children: [
                            {
                                path: "/instructor",
                                lazy: () => import("@/features/instructor/pages/InstructorDashboardPage").then((m) => ({ Component: m.InstructorDashboardPage })),
                            },
                            {
                                path: "/instructor/courses",
                                lazy: () => import("@/features/instructor/pages/InstructorCoursePage").then((m) => ({ Component: m.InstructorCoursePage })),
                            },
                            {
                                path: "/instructor/courses/new",
                                lazy: () => import("@/features/instructor/pages/InstructorCourseEditorPage").then((m) => ({ Component: m.InstructorCourseEditorPage })),
                            },
                            {
                                path: "/instructor/courses/:courseId",
                                lazy: () => import("@/features/instructor/pages/InstructorCourseEditorPage").then((m) => ({ Component: m.InstructorCourseEditorPage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/curriculum",
                                lazy: () => import("@/features/instructor/pages/InstructorCurriculumPage").then((m) => ({ Component: m.InstructorCurriculumPage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/quizzes",
                                lazy: () => import("@/features/instructor/pages/InstructorQuizWorkspacePage").then((m) => ({ Component: m.InstructorQuizWorkspacePage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/assessments",
                                lazy: () => import("@/features/instructor/pages/InstructorAssessmentWorkspacePage").then((m) => ({ Component: m.InstructorAssessmentWorkspacePage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/analytics",
                                lazy: () => import("@/features/instructor/pages/InstructorCourseAnalyticsPage").then((m) => ({ Component: m.InstructorCourseAnalyticsPage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/outcomes",
                                lazy: () => import("@/features/instructor/pages/InstructorCourseOutcomesPage").then((m) => ({ Component: m.InstructorCourseOutcomesPage })),
                            },
                            {
                                path: "/instructor/students",
                                lazy: () => import("@/features/instructor/pages/InstructorStudentsPage").then((m) => ({ Component: m.InstructorStudentsPage })),
                            },
                            {
                                path: "/instructor/students/:studentId",
                                lazy: () => import("@/features/instructor/pages/InstructorStudentProfilePage").then((m) => ({ Component: m.InstructorStudentProfilePage })),
                            },
                            { path: "/instructor/messages", element: <MessagesPage basePath="/instructor" getProfilePath={(participant) => participant.role === "Student" && participant.user_id ? `/instructor/students/${participant.user_id}` : null} /> },
                            { path: "/instructor/announcements", element: <MessagesPage mode="announcements" basePath="/instructor" announceHref="/instructor/announcements/new" /> },
                            { path: "/instructor/announcements/new", lazy: () => import("@/features/instructor/pages/InstructorAnnouncementsPage").then((m) => ({ Component: m.InstructorAnnouncementsPage })) },
                            ...staffHubRoutes("/instructor/staff-hub"),
                            { path: "/instructor/diagnostics", lazy: () => import("@/features/instructor/pages/InstructorDiagnosticsPage").then((m) => ({ Component: m.InstructorDiagnosticsPage })) },
                            { path: "/instructor/simulator", lazy: () => import("@/features/instructor/pages/InstructorSimulatorPage").then((m) => ({ Component: m.InstructorSimulatorPage })) },
                            { path: "/instructor/simulator/scanner", lazy: () => import("@/features/instructor/pages/scannerlab/InstructorScannerLabBuilderPage").then((m) => ({ Component: m.InstructorScannerLabBuilderPage })) },
                            { path: "/instructor/simulator/scanner/diagnostics", lazy: () => import("@/features/instructor/pages/scannerlab/InstructorScannerDiagnosticsBuilderPage").then((m) => ({ Component: m.InstructorScannerDiagnosticsBuilderPage })) },
                            { path: "/instructor/simulator/scanner/diagnostics/:variantId/systems", lazy: () => import("@/features/instructor/pages/scannerlab/InstructorScannerSystemSelectionPage").then((m) => ({ Component: m.InstructorScannerSystemSelectionPage })) },
                            { path: "/instructor/simulator/scanner/diagnostics/:variantId/systems/selection", lazy: () => import("@/features/instructor/pages/scannerlab/InstructorScannerSystemOverviewPage").then((m) => ({ Component: m.InstructorScannerSystemOverviewPage })) },
                            { path: "/instructor/simulator/scanner/diagnostics/:variantId/systems/selection/:systemKey", lazy: () => import("@/features/instructor/pages/scannerlab/InstructorScannerSystemOverviewPage").then((m) => ({ Component: m.InstructorScannerSystemOverviewPage })) },
                            { path: "/instructor/simulator/scanner/special-functions", lazy: () => import("@/features/instructor/pages/scannerlab/InstructorScannerSpecialFunctionsBuilderPage").then((m) => ({ Component: m.InstructorScannerSpecialFunctionsBuilderPage })) },
                            { path: "/instructor/simulator/scanner/missions", lazy: () => import("@/features/instructor/pages/scannerlab/InstructorScannerMissionsBuilderPage").then((m) => ({ Component: m.InstructorScannerMissionsBuilderPage })) },
                            { path: "/instructor/simulator/scanner/reports", lazy: () => import("@/features/instructor/pages/scannerlab/ScannerLabPlaceholderPages").then((m) => ({ Component: m.StudentReportsBuilderPage })) },
                            { path: "/instructor/simulator/scanner/settings", lazy: () => import("@/features/instructor/pages/scannerlab/ScannerLabPlaceholderPages").then((m) => ({ Component: m.ScannerLabSettingsPage })) },
                            { path: "/instructor/simulator/multimeter", lazy: () => import("@/features/instructor/pages/multimeterlab/InstructorMultimeterLabBuilderPage").then((m) => ({ Component: m.InstructorMultimeterLabBuilderPage })) },
                            { path: "/instructor/simulator/multimeter/measurements", lazy: () => import("@/features/instructor/pages/multimeterlab/MultimeterLabPlaceholderPages").then((m) => ({ Component: m.MultimeterMeasurementsBuilderPage })) },
                            { path: "/instructor/simulator/multimeter/missions", lazy: () => import("@/features/instructor/pages/multimeterlab/MultimeterLabPlaceholderPages").then((m) => ({ Component: m.MultimeterMissionsBuilderPage })) },
                            { path: "/instructor/simulator/multimeter/reports", lazy: () => import("@/features/instructor/pages/multimeterlab/MultimeterLabPlaceholderPages").then((m) => ({ Component: m.MultimeterReportsBuilderPage })) },
                            { path: "/instructor/simulator/multimeter/settings", lazy: () => import("@/features/instructor/pages/multimeterlab/MultimeterLabPlaceholderPages").then((m) => ({ Component: m.MultimeterSettingsBuilderPage })) },
                            { path: "/instructor/simulator/oscilloscope", lazy: () => import("@/features/instructor/pages/oscilloscopelab/InstructorOscilloscopeLabBuilderPage").then((m) => ({ Component: m.InstructorOscilloscopeLabBuilderPage })) },
                            { path: "/instructor/simulator/oscilloscope/exercises", lazy: () => import("@/features/instructor/pages/oscilloscopelab/OscilloscopeLabPlaceholderPages").then((m) => ({ Component: m.OscilloscopeExercisesBuilderPage })) },
                            { path: "/instructor/simulator/oscilloscope/faults", lazy: () => import("@/features/instructor/pages/oscilloscopelab/OscilloscopeLabPlaceholderPages").then((m) => ({ Component: m.OscilloscopeFaultsBuilderPage })) },
                            { path: "/instructor/simulator/oscilloscope/reports", lazy: () => import("@/features/instructor/pages/oscilloscopelab/OscilloscopeLabPlaceholderPages").then((m) => ({ Component: m.OscilloscopeReportsBuilderPage })) },
                            { path: "/instructor/simulator/oscilloscope/settings", lazy: () => import("@/features/instructor/pages/oscilloscopelab/OscilloscopeLabPlaceholderPages").then((m) => ({ Component: m.OscilloscopeSettingsBuilderPage })) },
                            { path: "/instructor/simulator/schematic", lazy: () => import("@/features/instructor/pages/schematiclab/InstructorSchematicLabBuilderPage").then((m) => ({ Component: m.InstructorSchematicLabBuilderPage })) },
                            { path: "/instructor/simulator/schematic/diagrams", lazy: () => import("@/features/instructor/pages/schematiclab/SchematicLabPlaceholderPages").then((m) => ({ Component: m.SchematicDiagramsBuilderPage })) },
                            { path: "/instructor/simulator/schematic/tasks", lazy: () => import("@/features/instructor/pages/schematiclab/SchematicLabPlaceholderPages").then((m) => ({ Component: m.SchematicTasksBuilderPage })) },
                            { path: "/instructor/simulator/schematic/reports", lazy: () => import("@/features/instructor/pages/schematiclab/SchematicLabPlaceholderPages").then((m) => ({ Component: m.SchematicReportsBuilderPage })) },
                            { path: "/instructor/simulator/schematic/settings", lazy: () => import("@/features/instructor/pages/schematiclab/SchematicLabPlaceholderPages").then((m) => ({ Component: m.SchematicSettingsBuilderPage })) },
                            // The old localStorage "lounge" feed was retired in
                            // favour of the real Staff Room — keep the URL alive.
                            { path: "/instructor/lounge", element: <Navigate to="/instructor/staff-hub/room" replace /> },
                            { path: "/instructor/revenue", lazy: () => import("@/features/instructor/pages/InstructorRevenuePage").then((m) => ({ Component: m.InstructorRevenuePage })) },
                            { path: "/instructor/profile", lazy: () => import("@/features/instructor/pages/InstructorProfilePage").then((m) => ({ Component: m.InstructorProfilePage })) },
                            { path: "/instructor/guide", lazy: () => import("@/features/guide/pages").then((m) => ({ Component: m.InstructorGuidePage })) },
                            { path: "/instructor/settings", lazy: () => import("@/features/instructor/pages/InstructorSettingsPage").then((m) => ({ Component: m.InstructorSettingsPage })) },
                        ],
                    },
                ],
            },
        ],
    },
];
