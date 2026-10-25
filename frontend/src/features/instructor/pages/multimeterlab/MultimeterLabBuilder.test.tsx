import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";

import i18n from "@/i18n";
import { InstructorMultimeterLabBuilderPage } from "./InstructorMultimeterLabBuilderPage";
import { MultimeterMeasurementsBuilderPage } from "./MultimeterLabPlaceholderPages";
import { simulatorBuilderApi } from "../../api/simulatorBuilder.api";
import { InstructorSimulatorPage } from "../InstructorSimulatorPage";
import { getInstructorSimulatorAnalytics } from "../../api/instructorApi";

vi.mock("../../api/simulatorBuilder.api", () => ({
    simulatorBuilderApi: {
        vehicles: vi.fn(),
        packs: vi.fn(),
        reviewQueue: vi.fn(),
    },
}));

vi.mock("../../api/instructorApi", () => ({
    getInstructorSimulatorAnalytics: vi.fn(),
}));

const api = vi.mocked(simulatorBuilderApi);
const analytics = vi.mocked(getInstructorSimulatorAnalytics);

function renderWith(ui: React.ReactElement, route = "/") {
    return render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </QueryClientProvider>
        </I18nextProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Multimeter lab builder hub", () => {
    it("shows the four builder cards with the right destinations", () => {
        renderWith(<InstructorMultimeterLabBuilderPage />, "/instructor/simulator/multimeter");

        const measurements = screen.getByTestId("lab-card-measurements");
        const missions = screen.getByTestId("lab-card-mm-missions");
        const reports = screen.getByTestId("lab-card-mm-reports");
        const settings = screen.getByTestId("lab-card-mm-settings");

        expect(measurements).toHaveAttribute("href", "/instructor/simulator/multimeter/measurements");
        expect(missions).toHaveAttribute("href", "/instructor/simulator/multimeter/missions");
        expect(reports).toHaveAttribute("href", "/instructor/simulator/multimeter/reports");
        expect(settings).toHaveAttribute("href", "/instructor/simulator/multimeter/settings");

        expect(screen.getByText("Measurements builder")).toBeInTheDocument();
        expect(screen.getByText("Missions")).toBeInTheDocument();
        expect(screen.getByText("Student reports")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();

        for (const card of [measurements, missions, reports, settings]) {
            expect(card.querySelector("img")).toBeTruthy();
            expect(card.querySelector("svg")).toBeTruthy();
        }
    });

    it("links back to the simulator", () => {
        renderWith(<InstructorMultimeterLabBuilderPage />, "/instructor/simulator/multimeter");
        expect(screen.getByTestId("multimeter-lab-header")).toHaveTextContent("Simulator");
    });
});

describe("Multimeter lab placeholder builders", () => {
    it("shows the coming-soon state and links back to the hub", () => {
        renderWith(<MultimeterMeasurementsBuilderPage />, "/instructor/simulator/multimeter/measurements");

        expect(screen.getByTestId("multimeter-lab-measurements-page")).toBeInTheDocument();
        expect(screen.getByText("Measurements builder")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Coming soon");
        expect(screen.getByRole("link", { name: /Multimeter lab builder/i })).toHaveAttribute(
            "href",
            "/instructor/simulator/multimeter",
        );
    });
});

describe("Simulator page lab-builders strip", () => {
    it("renders all four lab builder cards side by side", async () => {
        api.vehicles.mockResolvedValue([]);
        api.packs.mockResolvedValue([]);
        api.reviewQueue.mockResolvedValue([]);
        analytics.mockResolvedValue({ totals: { sessions: 0 } } as Awaited<ReturnType<typeof getInstructorSimulatorAnalytics>>);

        renderWith(<InstructorSimulatorPage />, "/instructor/simulator");

        const scanner = await screen.findByTestId("lab-card-scanner");
        const multimeter = await screen.findByTestId("lab-card-multimeter");
        const oscilloscope = await screen.findByTestId("lab-card-oscilloscope");
        const schematic = await screen.findByTestId("lab-card-schematic");
        expect(scanner).toHaveAttribute("href", "/instructor/simulator/scanner");
        expect(multimeter).toHaveAttribute("href", "/instructor/simulator/multimeter");
        expect(oscilloscope).toHaveAttribute("href", "/instructor/simulator/oscilloscope");
        expect(schematic).toHaveAttribute("href", "/instructor/simulator/schematic");
        expect(screen.getByText("Scanner lab builder")).toBeInTheDocument();
        expect(screen.getByText("Multimeter lab builder")).toBeInTheDocument();
        expect(screen.getByText("Oscilloscope lab builder")).toBeInTheDocument();
        expect(screen.getByText("Schematic lab builder")).toBeInTheDocument();
    });
});
