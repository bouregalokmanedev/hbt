import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";

import i18n from "@/i18n";
import { LabBuilderCard } from "../../components/lab-builder/LabBuilderCard";
import { InstructorScannerLabBuilderPage } from "./InstructorScannerLabBuilderPage";
import { InstructorScannerDiagnosticsBuilderPage } from "./InstructorScannerDiagnosticsBuilderPage";
import { simulatorBuilderApi } from "../../api/simulatorBuilder.api";
import { InstructorSimulatorPage } from "../InstructorSimulatorPage";
import { getInstructorSimulatorAnalytics } from "../../api/instructorApi";

vi.mock("../../api/simulatorBuilder.api", () => ({
    simulatorBuilderApi: {
        vehicles: vi.fn(),
        createVariant: vi.fn(),
        updateVariant: vi.fn(),
        packs: vi.fn(),
        createPack: vi.fn(),
        updatePack: vi.fn(),
        submitPack: vi.fn(),
        archivePack: vi.fn(),
        restorePack: vi.fn(),
        destroyPack: vi.fn(),
        destroyVariant: vi.fn(),
        reviewQueue: vi.fn(),
        approvePack: vi.fn(),
        rejectPack: vi.fn(),
    },
}));

vi.mock("../../api/instructorApi", () => ({
    getInstructorSimulatorAnalytics: vi.fn(),
}));

const api = vi.mocked(simulatorBuilderApi);
const analytics = vi.mocked(getInstructorSimulatorAnalytics);

const catalog = [
    {
        id: "m1",
        name: "Toyota",
        slug: "toyota",
        models: [
            {
                id: "mod1",
                name: "Corolla",
                variants: [
                    {
                        id: "v9",
                        name: "1.8 Hybrid",
                        engine_code: "2ZR",
                        fuel_type: "Petrol",
                        transmission: "Auto",
                        year_from: 2020,
                        year_to: 2024,
                        metadata: null,
                        packs_count: 2,
                    },
                ],
            },
        ],
    },
];

function makeClient() {
    return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWith(ui: React.ReactElement, route = "/") {
    return render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={makeClient()}>
                <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </QueryClientProvider>
        </I18nextProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Scanner lab builder hub", () => {
    it("shows the four builder cards with the right destinations", () => {
        renderWith(<InstructorScannerLabBuilderPage />, "/instructor/simulator/scanner");

        const diagnostics = screen.getByTestId("lab-card-diagnostics");
        const special = screen.getByTestId("lab-card-special-functions");
        const reports = screen.getByTestId("lab-card-reports");
        const settings = screen.getByTestId("lab-card-settings");

        expect(diagnostics).toHaveAttribute("href", "/instructor/simulator/scanner/diagnostics");
        expect(special).toHaveAttribute("href", "/instructor/simulator/scanner/special-functions");
        expect(reports).toHaveAttribute("href", "/instructor/simulator/scanner/reports");
        expect(settings).toHaveAttribute("href", "/instructor/simulator/scanner/settings");

        expect(screen.getByText("Diagnostics builder")).toBeInTheDocument();
        expect(screen.getByText("Special function builder")).toBeInTheDocument();
        expect(screen.getByText("Student reports")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();

        // Every card carries a picture and an icon.
        for (const card of [diagnostics, special, reports, settings]) {
            expect(card.querySelector("img")).toBeTruthy();
            expect(card.querySelector("svg")).toBeTruthy();
        }
    });
});

describe("LabBuilderCard", () => {
    it("renders the picture, icon and title", () => {
        renderWith(<LabBuilderCard to="/x" title="My lab" description="Desc" image="/assets/simulator/detail-H3.png" icon={Settings} />);
        const link = screen.getByRole("link", { name: /My lab/i });
        const img = link.querySelector("img");
        expect(img).toHaveAttribute("src", "/assets/simulator/detail-H3.png");
        expect(link.querySelector("svg")).toBeTruthy();
        expect(screen.getByText("Desc")).toBeInTheDocument();
    });
});

describe("Scanner diagnostics builder", () => {
    it("lists the vehicle library and hands a vehicle to the simulator", async () => {
        api.vehicles.mockResolvedValue(catalog as Awaited<ReturnType<typeof simulatorBuilderApi.vehicles>>);

        renderWith(
            <Routes>
                <Route path="/instructor/simulator/scanner/diagnostics" element={<InstructorScannerDiagnosticsBuilderPage />} />
                <Route path="/instructor/simulator" element={<LocationProbe />} />
            </Routes>,
            "/instructor/simulator/scanner/diagnostics",
        );

        expect(await screen.findByText(/Toyota Corolla · 1.8 Hybrid/)).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("use-vehicle-v9"));
        expect(await screen.findByTestId("location-probe")).toHaveTextContent("tab=variants&variantId=v9");
    });

    it("creates a vehicle from the form and offers the fault variants handoff", async () => {
        api.vehicles.mockResolvedValue([]);
        api.createVariant.mockResolvedValue({ id: "v-new", name: "1.8 Hybrid" } as Awaited<ReturnType<typeof simulatorBuilderApi.createVariant>>);

        renderWith(
            <Routes>
                <Route path="/instructor/simulator/scanner/diagnostics" element={<InstructorScannerDiagnosticsBuilderPage />} />
                <Route path="/instructor/simulator" element={<LocationProbe />} />
            </Routes>,
            "/instructor/simulator/scanner/diagnostics",
        );

        fireEvent.change(screen.getByLabelText("Make"), { target: { value: "Toyota" } });
        fireEvent.change(screen.getByLabelText("Model"), { target: { value: "Corolla" } });
        fireEvent.change(screen.getByLabelText("Variant"), { target: { value: "1.8 Hybrid" } });
        fireEvent.click(screen.getByTestId("diagnostics-create-submit"));

        await waitFor(() =>
            expect(api.createVariant).toHaveBeenCalledWith({
                make_name: "Toyota",
                model_name: "Corolla",
                name: "1.8 Hybrid",
                engine_code: undefined,
                fuel_type: undefined,
                transmission: undefined,
                year_from: undefined,
                year_to: undefined,
            }),
        );
        expect(await screen.findByRole("status")).toHaveTextContent(/Vehicle created/i);

        fireEvent.click(screen.getByTestId("diagnostics-open-builder"));
        expect(await screen.findByTestId("location-probe")).toHaveTextContent("tab=variants&variantId=v-new");
    });
});

describe("Simulator page lab-builders strip + deep-link", () => {
    it("renders the scanner lab builder card", async () => {
        api.vehicles.mockResolvedValue([]);
        api.packs.mockResolvedValue([]);
        api.reviewQueue.mockResolvedValue([]);
        analytics.mockResolvedValue({ totals: { sessions: 0 } } as Awaited<ReturnType<typeof getInstructorSimulatorAnalytics>>);

        renderWith(<InstructorSimulatorPage />, "/instructor/simulator");

        const card = await screen.findByTestId("lab-card-scanner");
        expect(card).toHaveAttribute("href", "/instructor/simulator/scanner");
        expect(card.querySelector("img")).toBeTruthy();
        expect(card.querySelector("svg")).toBeTruthy();
    });

    it("honours location.state deep-links into a variant's packs", async () => {
        api.vehicles.mockResolvedValue(catalog as Awaited<ReturnType<typeof simulatorBuilderApi.vehicles>>);
        api.packs.mockResolvedValue([]);
        api.reviewQueue.mockResolvedValue([]);
        analytics.mockResolvedValue({ totals: { sessions: 0 } } as Awaited<ReturnType<typeof getInstructorSimulatorAnalytics>>);

        render(
            <I18nextProvider i18n={i18n}>
                <QueryClientProvider client={makeClient()}>
                    <MemoryRouter
                        initialEntries={[{ pathname: "/instructor/simulator", state: { tab: "variants", variantId: "v9" } }]}
                    >
                        <Routes>
                            <Route path="/instructor/simulator" element={<InstructorSimulatorPage />} />
                        </Routes>
                    </MemoryRouter>
                </QueryClientProvider>
            </I18nextProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("simulator-tab-variants")).toHaveAttribute("aria-pressed", "true");
        });
        await waitFor(() => expect(api.packs).toHaveBeenCalledWith("v9"));
    });
});

function LocationProbe() {
    const location = useLocation();
    const state = (location.state ?? {}) as { tab?: string; variantId?: string };
    return (
        <div data-testid="location-probe">
            {location.pathname} tab={state.tab ?? ""}&variantId={state.variantId ?? ""}
        </div>
    );
}
