import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";

import i18n from "@/i18n";
import { InstructorSchematicLabBuilderPage } from "./InstructorSchematicLabBuilderPage";
import { SchematicDiagramsBuilderPage } from "./SchematicLabPlaceholderPages";

function renderWith(ui: React.ReactElement, route = "/") {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </I18nextProvider>,
    );
}

describe("Schematic lab builder hub", () => {
    it("shows the four builder cards with the right destinations", () => {
        renderWith(<InstructorSchematicLabBuilderPage />, "/instructor/simulator/schematic");

        const diagrams = screen.getByTestId("lab-card-schematic-diagrams");
        const tasks = screen.getByTestId("lab-card-schematic-tasks");
        const reports = screen.getByTestId("lab-card-schematic-reports");
        const settings = screen.getByTestId("lab-card-schematic-settings");

        expect(diagrams).toHaveAttribute("href", "/instructor/simulator/schematic/diagrams");
        expect(tasks).toHaveAttribute("href", "/instructor/simulator/schematic/tasks");
        expect(reports).toHaveAttribute("href", "/instructor/simulator/schematic/reports");
        expect(settings).toHaveAttribute("href", "/instructor/simulator/schematic/settings");

        expect(screen.getByText("Diagram builder")).toBeInTheDocument();
        expect(screen.getByText("Tracing tasks")).toBeInTheDocument();
        expect(screen.getByText("Student reports")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();

        for (const card of [diagrams, tasks, reports, settings]) {
            expect(card.querySelector("img")).toBeTruthy();
            expect(card.querySelector("svg")).toBeTruthy();
        }
    });

    it("links back to the simulator", () => {
        renderWith(<InstructorSchematicLabBuilderPage />, "/instructor/simulator/schematic");
        expect(screen.getByTestId("schematic-lab-header")).toHaveTextContent("Simulator");
    });
});

describe("Schematic lab placeholder builders", () => {
    it("shows the coming-soon state and links back to the hub", () => {
        renderWith(<SchematicDiagramsBuilderPage />, "/instructor/simulator/schematic/diagrams");

        expect(screen.getByTestId("schematic-lab-diagrams-page")).toBeInTheDocument();
        expect(screen.getByText("Diagram builder")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Coming soon");
        expect(screen.getByRole("link", { name: /Schematic lab builder/i })).toHaveAttribute(
            "href",
            "/instructor/simulator/schematic",
        );
    });
});
