import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";

import i18n from "@/i18n";
import { SPECIAL_FUNCTIONS } from "../../data/specialFunctions";
import { specialFunctionsStore } from "../../data/specialFunctionsStore";
import { simulatorBuilderApi } from "../../api/simulatorBuilder.api";
import { InstructorScannerSpecialFunctionsBuilderPage } from "./InstructorScannerSpecialFunctionsBuilderPage";

vi.mock("../../api/simulatorBuilder.api", () => ({
    simulatorBuilderApi: {
        vehicles: vi.fn(),
    },
}));

const api = vi.mocked(simulatorBuilderApi);

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
                        packs_count: 0,
                    },
                ],
            },
        ],
    },
];

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                <MemoryRouter initialEntries={["/instructor/simulator/scanner/special-functions"]}>
                    <InstructorScannerSpecialFunctionsBuilderPage />
                </MemoryRouter>
            </QueryClientProvider>
        </I18nextProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    specialFunctionsStore.reset();
});

describe("Special functions builder", () => {
    it("shows all 26 scanner special functions", () => {
        api.vehicles.mockResolvedValue([]);
        renderPage();

        for (const fn of SPECIAL_FUNCTIONS) {
            expect(screen.getByTestId(`sf-fn-${fn.id}`)).toHaveTextContent(fn.label);
        }
        expect(screen.getByTestId("sf-fn-dpf-regen")).toHaveTextContent("DPF Regen");
        expect(screen.getByTestId("sf-fn-eps-adaptation")).toHaveTextContent("EPS Adaptation");
        expect(screen.getByTestId("sf-fn-gpf-regen")).toHaveTextContent("GPF Regen");
    });

    it("opens vehicle selection when a function is picked", async () => {
        api.vehicles.mockResolvedValue(catalog as Awaited<ReturnType<typeof simulatorBuilderApi.vehicles>>);
        renderPage();

        fireEvent.click(screen.getByTestId("sf-fn-oil-reset"));

        expect(await screen.findByText(/Toyota Corolla · 1.8 Hybrid/)).toBeInTheDocument();
        expect(screen.getByTestId("sf-back-to-grid")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("sf-back-to-grid"));
        expect(screen.getByTestId("sf-fn-oil-reset")).toBeInTheDocument();
    });

    it("saves an instance from the popup with title, description and image", async () => {
        api.vehicles.mockResolvedValue(catalog as Awaited<ReturnType<typeof simulatorBuilderApi.vehicles>>);
        renderPage();

        fireEvent.click(screen.getByTestId("sf-fn-dpf-regen"));
        fireEvent.click(await screen.findByTestId("sf-vehicle-v9"));

        expect(screen.getByTestId("sf-modal")).toBeInTheDocument();

        // Title is required.
        fireEvent.click(screen.getByTestId("sf-save"));
        expect(screen.getByRole("alert")).toHaveTextContent(/title is required/i);

        fireEvent.change(screen.getByTestId("sf-title"), { target: { value: "Force DPF regen" } });
        fireEvent.change(screen.getByTestId("sf-description"), { target: { value: "Hold 2500 RPM until soot load drops." } });
        fireEvent.click(screen.getByTestId("sf-save"));

        expect(screen.queryByTestId("sf-modal")).not.toBeInTheDocument();

        const saved = specialFunctionsStore.list();
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({
            functionId: "dpf-regen",
            vehicleVariantId: "v9",
            vehicleLabel: "Toyota Corolla · 1.8 Hybrid",
            title: "Force DPF regen",
            description: "Hold 2500 RPM until soot load drops.",
        });

        // Back on the grid: count badge + saved row.
        fireEvent.click(screen.getByTestId("sf-back-to-grid"));
        expect(screen.getByTestId("sf-count-dpf-regen")).toHaveTextContent("1");
        expect(screen.getByText("Force DPF regen")).toBeInTheDocument();
    });

    it("deletes a saved instance", async () => {
        specialFunctionsStore.add({
            functionId: "oil-reset",
            vehicleVariantId: "v9",
            vehicleLabel: "Toyota Corolla · 1.8 Hybrid",
            title: "Oil life reset",
            description: "",
            image: null,
        });
        api.vehicles.mockResolvedValue([]);
        renderPage();

        expect(screen.getByTestId("sf-count-oil-reset")).toHaveTextContent("1");
        const instance = specialFunctionsStore.list()[0];
        fireEvent.click(screen.getByTestId(`sf-delete-${instance.id}`));

        expect(specialFunctionsStore.list()).toHaveLength(0);
        expect(screen.queryByTestId("sf-count-oil-reset")).not.toBeInTheDocument();
    });
});
