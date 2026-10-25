import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";

import i18n from "@/i18n";
import { InstructorOscilloscopeLabBuilderPage } from "./InstructorOscilloscopeLabBuilderPage";
import { OscilloscopeExercisesBuilderPage } from "./OscilloscopeLabPlaceholderPages";

function renderWith(ui: React.ReactElement, route = "/") {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </I18nextProvider>,
    );
}

describe("Oscilloscope lab builder hub", () => {
    it("shows the four builder cards with the right destinations", () => {
        renderWith(<InstructorOscilloscopeLabBuilderPage />, "/instructor/simulator/oscilloscope");

        const exercises = screen.getByTestId("lab-card-scope-exercises");
        const faults = screen.getByTestId("lab-card-scope-faults");
        const reports = screen.getByTestId("lab-card-scope-reports");
        const settings = screen.getByTestId("lab-card-scope-settings");

        expect(exercises).toHaveAttribute("href", "/instructor/simulator/oscilloscope/exercises");
        expect(faults).toHaveAttribute("href", "/instructor/simulator/oscilloscope/faults");
        expect(reports).toHaveAttribute("href", "/instructor/simulator/oscilloscope/reports");
        expect(settings).toHaveAttribute("href", "/instructor/simulator/oscilloscope/settings");

        expect(screen.getByText("Exercises builder")).toBeInTheDocument();
        expect(screen.getByText("Signal faults")).toBeInTheDocument();
        expect(screen.getByText("Student reports")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();

        for (const card of [exercises, faults, reports, settings]) {
            expect(card.querySelector("img")).toBeTruthy();
            expect(card.querySelector("svg")).toBeTruthy();
        }
    });

    it("links back to the simulator", () => {
        renderWith(<InstructorOscilloscopeLabBuilderPage />, "/instructor/simulator/oscilloscope");
        expect(screen.getByTestId("oscilloscope-lab-header")).toHaveTextContent("Simulator");
    });
});

describe("Oscilloscope lab placeholder builders", () => {
    it("shows the coming-soon state and links back to the hub", () => {
        renderWith(<OscilloscopeExercisesBuilderPage />, "/instructor/simulator/oscilloscope/exercises");

        expect(screen.getByTestId("oscilloscope-lab-exercises-page")).toBeInTheDocument();
        expect(screen.getByText("Exercises builder")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Coming soon");
        expect(screen.getByRole("link", { name: /Oscilloscope lab builder/i })).toHaveAttribute(
            "href",
            "/instructor/simulator/oscilloscope",
        );
    });
});
