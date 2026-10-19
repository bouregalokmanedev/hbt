import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import i18n from "@/i18n";
import {
    DEFAULT_DRIVETRAIN_ECUS,
    DEFAULT_CHASSIS_ECUS,
    DEFAULT_BODY_ECUS,
    DDE_LIVE_DATA,
    vehicleSystemsStore,
    makeId,
} from "../../data/vehicleSystems";
import { simulatorBuilderApi } from "../../api/simulatorBuilder.api";
import { InstructorScannerSystemSelectionPage } from "./InstructorScannerSystemSelectionPage";
import { InstructorScannerSystemOverviewPage } from "./InstructorScannerSystemOverviewPage";

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

function renderAt(path: string) {
    return render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                <MemoryRouter initialEntries={[path]}>
                    <Routes>
                        <Route path="/instructor/simulator/scanner/diagnostics/:variantId/systems" element={<InstructorScannerSystemSelectionPage />} />
                        <Route path="/instructor/simulator/scanner/diagnostics/:variantId/systems/selection" element={<InstructorScannerSystemOverviewPage />} />
                        <Route path="/instructor/simulator/scanner/diagnostics/:variantId/systems/selection/:systemKey" element={<InstructorScannerSystemOverviewPage />} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        </I18nextProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    vehicleSystemsStore.reset();
});

describe("System selection gateway (Page A)", () => {
    it("shows the system selection card with the pre-seeded ECU count", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems");

        await waitFor(() => expect(screen.getByTestId("system-selection-card")).toBeInTheDocument());
        expect(screen.getByTestId("system-selection-card")).toHaveTextContent("System selection");
        // 5 drivetrain + 4 chassis + 16 body
        expect(screen.getByTestId("system-selection-card")).toHaveTextContent(`${DEFAULT_DRIVETRAIN_ECUS.length + DEFAULT_CHASSIS_ECUS.length + DEFAULT_BODY_ECUS.length} ECUs`);
    });
});

describe("System overview (Page B)", () => {
    it("shows the 3 system cards with their ECU counts", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection");

        await waitFor(() => expect(screen.getByTestId("system-card-drivetrain")).toBeInTheDocument());
        expect(screen.getByTestId("system-card-drivetrain")).toHaveTextContent("Drivetrain system");
        expect(screen.getByTestId("system-card-drivetrain")).toHaveTextContent(`${DEFAULT_DRIVETRAIN_ECUS.length} ECUs`);
        expect(screen.getByTestId("system-card-chassis")).toHaveTextContent("Chassis system");
        expect(screen.getByTestId("system-card-chassis")).toHaveTextContent(`${DEFAULT_CHASSIS_ECUS.length} ECUs`);
        expect(screen.getByTestId("system-card-body")).toHaveTextContent("Body system");
        expect(screen.getByTestId("system-card-body")).toHaveTextContent(`${DEFAULT_BODY_ECUS.length} ECUs`);
    });
});

describe("System ECU authoring (Page C)", () => {
    it("pre-seeds the 5 drivetrain ECUs and exposes the 4 authoring options per ECU", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/drivetrain");

        await waitFor(() => expect(screen.getByTestId("system-ecus-drivetrain")).toBeInTheDocument());
        for (const name of DEFAULT_DRIVETRAIN_ECUS) {
            expect(screen.getByText(name)).toBeInTheDocument();
        }

        const systems = vehicleSystemsStore.getSystems("v9");
        const ecu = systems.systems.drivetrain[0];
        for (const action of ["info", "dtc", "live", "actuator"] as const) {
            expect(screen.getByTestId(`ecu-action-${ecu.id}-${action}`)).toBeInTheDocument();
        }
    });

    it("pre-seeds chassis ECUs and exposes the 4 authoring options per ECU", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/chassis");

        await waitFor(() => expect(screen.getByTestId("system-ecus-chassis")).toBeInTheDocument());
        for (const name of DEFAULT_CHASSIS_ECUS) {
            expect(screen.getByText(name)).toBeInTheDocument();
        }

        const ecu = vehicleSystemsStore.getSystems("v9").systems.chassis[0];
        for (const action of ["info", "dtc", "live", "actuator"] as const) {
            expect(screen.getByTestId(`ecu-action-${ecu.id}-${action}`)).toBeInTheDocument();
        }
        // the add form still allows custom ECUs
        expect(screen.getByTestId("add-ecu-name")).toBeInTheDocument();
        expect(screen.getByTestId("add-ecu-submit")).toBeInTheDocument();
    });

    it("pre-seeds the 16 body ECUs", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/body");

        await waitFor(() => expect(screen.getByTestId("system-ecus-body")).toBeInTheDocument());
        for (const name of DEFAULT_BODY_ECUS) {
            expect(screen.getByText(name)).toBeInTheDocument();
        }
        expect(vehicleSystemsStore.getSystems("v9").systems.body).toHaveLength(DEFAULT_BODY_ECUS.length);
    });

    it("adds a DTC through the authoring modal and persists it to the store", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/drivetrain");

        await waitFor(() => expect(screen.getByTestId("system-ecus-drivetrain")).toBeInTheDocument());
        const systems = vehicleSystemsStore.getSystems("v9");
        const ecu = systems.systems.drivetrain[0];

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-dtc`));
        await waitFor(() => expect(screen.getByTestId("ecu-authoring-modal")).toBeInTheDocument());

        fireEvent.change(screen.getByTestId("dtc-code"), { target: { value: "P0301" } });
        fireEvent.change(screen.getByTestId("dtc-desc"), { target: { value: "Cylinder 1 misfire" } });
        fireEvent.click(screen.getByTestId("dtc-add"));

        const after = vehicleSystemsStore.getSystems("v9");
        expect(after.systems.drivetrain[0].dtcs).toHaveLength(1);
        expect(after.systems.drivetrain[0].dtcs[0].code).toBe("P0301");
        expect(after.systems.drivetrain[0].dtcs[0].desc).toBe("Cylinder 1 misfire");
    });

    it("adds a new custom ECU to a seeded system via the add form", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/body");

        await waitFor(() => expect(screen.getByTestId("system-ecus-body")).toBeInTheDocument());
        fireEvent.change(screen.getByTestId("add-ecu-name"), { target: { value: "Light Module" } });
        fireEvent.click(screen.getByTestId("add-ecu-submit"));

        const after = vehicleSystemsStore.getSystems("v9");
        expect(after.systems.body).toHaveLength(DEFAULT_BODY_ECUS.length + 1);
        expect(after.systems.body[after.systems.body.length - 1].name).toBe("Light Module");
    });

    it("saves ECU info (system name, programming date, manufacture date, supplier, serial number) to the store", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/drivetrain");

        await waitFor(() => expect(screen.getByTestId("system-ecus-drivetrain")).toBeInTheDocument());
        const ecu = vehicleSystemsStore.getSystems("v9").systems.drivetrain[0];

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-info`));
        await waitFor(() => expect(screen.getByTestId("info-system-name")).toBeInTheDocument());

        fireEvent.change(screen.getByTestId("info-system-name"), { target: { value: "Main Engine ECU" } });
        fireEvent.change(screen.getByTestId("info-programming-date"), { target: { value: "2024-03-15" } });
        fireEvent.change(screen.getByTestId("info-manufacture-date"), { target: { value: "2023-11-02" } });
        fireEvent.change(screen.getByTestId("info-supplier"), { target: { value: "Bosch" } });
        fireEvent.change(screen.getByTestId("info-serial-number"), { target: { value: "SN-123456" } });
        fireEvent.click(screen.getByTestId("info-save"));

        const after = vehicleSystemsStore.getSystems("v9");
        expect(after.systems.drivetrain[0].info).not.toBeNull();
        expect(after.systems.drivetrain[0].info?.systemName).toBe("Main Engine ECU");
        expect(after.systems.drivetrain[0].info?.programmingDate).toBe("2024-03-15");
        expect(after.systems.drivetrain[0].info?.manufactureDate).toBe("2023-11-02");
        expect(after.systems.drivetrain[0].info?.supplier).toBe("Bosch");
        expect(after.systems.drivetrain[0].info?.serialNumber).toBe("SN-123456");
    });

    it("defaults the system name to the control-unit card title and allows a 'None' supplier", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/drivetrain");

        await waitFor(() => expect(screen.getByTestId("system-ecus-drivetrain")).toBeInTheDocument());
        const ecu = vehicleSystemsStore.getSystems("v9").systems.drivetrain[0];

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-info`));
        await waitFor(() => expect(screen.getByTestId("info-system-name")).toBeInTheDocument());

        // system name pre-filled with the card title, supplier defaults to "none"
        expect(screen.getByTestId<HTMLInputElement>("info-system-name").value).toBe(ecu.name);
        expect(screen.getByTestId<HTMLSelectElement>("info-supplier").value).toBe("none");

        // keep the default name, choose a real supplier
        fireEvent.change(screen.getByTestId("info-supplier"), { target: { value: "Bosch" } });
        fireEvent.click(screen.getByTestId("info-save"));

        const after = vehicleSystemsStore.getSystems("v9");
        expect(after.systems.drivetrain[0].info?.systemName).toBe(ecu.name);
        expect(after.systems.drivetrain[0].info?.supplier).toBe("Bosch");
    });

    it("saves a 'none' supplier when no supplier is chosen", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/drivetrain");

        await waitFor(() => expect(screen.getByTestId("system-ecus-drivetrain")).toBeInTheDocument());
        const ecu = vehicleSystemsStore.getSystems("v9").systems.drivetrain[0];

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-info`));
        await waitFor(() => expect(screen.getByTestId("info-supplier")).toBeInTheDocument());

        fireEvent.change(screen.getByTestId("info-serial-number"), { target: { value: "SN-001" } });
        fireEvent.click(screen.getByTestId("info-save"));

        const after = vehicleSystemsStore.getSystems("v9");
        expect(after.systems.drivetrain[0].info?.supplier).toBe("none");
    });

    it("adds a live-data PID and an actuator test through their modals", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/drivetrain");

        await waitFor(() => expect(screen.getByTestId("system-ecus-drivetrain")).toBeInTheDocument());
        const ecu = vehicleSystemsStore.getSystems("v9").systems.drivetrain[0];

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-live`));
        await waitFor(() => expect(screen.getByTestId("live-pid")).toBeInTheDocument());
        fireEvent.change(screen.getByTestId("live-pid"), { target: { value: "010C" } });
        fireEvent.change(screen.getByTestId("live-label"), { target: { value: "Engine RPM" } });
        fireEvent.change(screen.getByTestId("live-unit"), { target: { value: "rpm" } });
        fireEvent.click(screen.getByTestId("live-add"));

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-actuator`));
        await waitFor(() => expect(screen.getByTestId("act-name")).toBeInTheDocument());
        fireEvent.change(screen.getByTestId("act-name"), { target: { value: "Fuel pump" } });
        fireEvent.change(screen.getByTestId("act-desc"), { target: { value: "Prime the fuel pump" } });
        fireEvent.click(screen.getByTestId("act-add"));

        const after = vehicleSystemsStore.getSystems("v9");
        expect(after.systems.drivetrain[0].liveData).toHaveLength(DDE_LIVE_DATA.length + 1);
        const added = after.systems.drivetrain[0].liveData[after.systems.drivetrain[0].liveData.length - 1];
        expect(added.pid).toBe("010C");
        expect(added.unit).toBe("rpm");
        expect(after.systems.drivetrain[0].actuators).toHaveLength(1);
        expect(after.systems.drivetrain[0].actuators[0].name).toBe("Fuel pump");
    });

    it("seeds Digital Engine Electronics with the scan-tool live data (numbers and temperatures)", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/drivetrain");

        await waitFor(() => expect(screen.getByTestId("system-ecus-drivetrain")).toBeInTheDocument());
        const ecu = vehicleSystemsStore.getSystems("v9").systems.drivetrain[0];
        expect(ecu.name).toBe("Digital Engine Electronics");
        expect(ecu.liveData).toHaveLength(DDE_LIVE_DATA.length);

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-live`));
        await waitFor(() => expect(screen.getByTestId("live-pid")).toBeInTheDocument());

        // the seeded values are present and editable (number + temperature rows)
        const coolant = ecu.liveData.find((p) => p.label === "Coolant temperature");
        const speed = ecu.liveData.find((p) => p.label === "Engine speed");
        expect(coolant?.unit).toBe("deg C");
        expect(coolant?.base).toBe("-46.50");
        expect(speed?.unit).toBe("1/min");
        expect(speed?.base).toBe("2479.75");

        fireEvent.change(screen.getByTestId(`live-value-${coolant!.id}`), { target: { value: "92.5" } });
        fireEvent.change(screen.getByTestId(`live-unit-${coolant!.id}`), { target: { value: "deg F" } });

        const after = vehicleSystemsStore.getSystems("v9");
        const coolantAfter = after.systems.drivetrain[0].liveData.find((p) => p.label === "Coolant temperature");
        expect(coolantAfter?.base).toBe("92.5");
        expect(coolantAfter?.unit).toBe("deg F");
        expect(after.systems.drivetrain[0].liveData).toHaveLength(DDE_LIVE_DATA.length);
    });

    it("lets the instructor pick a library parameter, adjust its value, and add it", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/drivetrain");

        await waitFor(() => expect(screen.getByTestId("system-ecus-drivetrain")).toBeInTheDocument());
        const ecu = vehicleSystemsStore.getSystems("v9").systems.drivetrain[0];

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-live`));
        await waitFor(() => expect(screen.getByTestId("live-pick")).toBeInTheDocument());

        fireEvent.change(screen.getByTestId("live-pick"), { target: { value: "010F" } });
        expect(screen.getByTestId<HTMLInputElement>("live-pid").value).toBe("010F");
        expect(screen.getByTestId<HTMLInputElement>("live-label").value).toBe("Intake air temperature");
        expect(screen.getByTestId<HTMLInputElement>("live-unit").value).toBe("deg C");
        expect(screen.getByTestId<HTMLInputElement>("live-base").value).toBe("35.00");

        fireEvent.change(screen.getByTestId("live-base"), { target: { value: "48.2" } });
        fireEvent.click(screen.getByTestId("live-add"));

        const after = vehicleSystemsStore.getSystems("v9");
        expect(after.systems.drivetrain[0].liveData).toHaveLength(DDE_LIVE_DATA.length + 1);
        const added = after.systems.drivetrain[0].liveData[after.systems.drivetrain[0].liveData.length - 1];
        expect(added.pid).toBe("010F");
        expect(added.label).toBe("Intake air temperature");
        expect(added.unit).toBe("deg C");
        expect(added.base).toBe("48.2");
    });

    it("still allows a fully custom live-data entry typed by hand", async () => {
        api.vehicles.mockResolvedValue(catalog);
        renderAt("/instructor/simulator/scanner/diagnostics/v9/systems/selection/chassis");

        await waitFor(() => expect(screen.getByTestId("system-ecus-chassis")).toBeInTheDocument());
        const ecu = vehicleSystemsStore.getSystems("v9").systems.chassis[0];

        fireEvent.click(screen.getByTestId(`ecu-action-${ecu.id}-live`));
        await waitFor(() => expect(screen.getByTestId("live-pid")).toBeInTheDocument());

        fireEvent.change(screen.getByTestId("live-pid"), { target: { value: "CUSTOM1" } });
        fireEvent.change(screen.getByTestId("live-label"), { target: { value: "My sensor" } });
        fireEvent.change(screen.getByTestId("live-unit"), { target: { value: "bar" } });
        fireEvent.change(screen.getByTestId("live-base"), { target: { value: "3.5" } });
        fireEvent.click(screen.getByTestId("live-add"));

        const after = vehicleSystemsStore.getSystems("v9");
        const added = after.systems.chassis[0].liveData[0];
        expect(added.pid).toBe("CUSTOM1");
        expect(added.base).toBe("3.5");
    });
});

describe("vehicleSystems store", () => {
    it("returns a stable default object across snapshots for an unknown variant", () => {
        const a = vehicleSystemsStore.getSystems("unknown-1");
        const b = vehicleSystemsStore.getSystems("unknown-1");
        expect(a).toBe(b);
        expect(a.systems.drivetrain).toHaveLength(DEFAULT_DRIVETRAIN_ECUS.length);
        expect(a.systems.chassis).toHaveLength(DEFAULT_CHASSIS_ECUS.length);
        expect(a.systems.body).toHaveLength(DEFAULT_BODY_ECUS.length);
    });

    it("persists mutations and reloads them after a reset of the cache", () => {
        vehicleSystemsStore.mutateSystems("v-store", (s) => ({
            ...s,
            systems: { ...s.systems, chassis: [{ id: makeId(), name: "ABS", info: null, dtcs: [], liveData: [], actuators: [] }] },
        }));
        const loaded = vehicleSystemsStore.getSystems("v-store");
        expect(loaded.systems.chassis).toHaveLength(1);
        expect(loaded.systems.chassis[0].name).toBe("ABS");
        expect(loaded.updatedAt).toBeTruthy();
    });

    it("backfills the DDE live-data seed into trees saved by older versions", () => {
        // simulate a tree stored before the seed existed (no seedVersion, empty liveData)
        localStorage.setItem(
            "hbt-scanner-vehicle-systems",
            JSON.stringify({
                "v-legacy": {
                    variantId: "v-legacy",
                    updatedAt: "2026-01-01T00:00:00.000Z",
                    systems: {
                        drivetrain: [
                            { id: "e1", name: "Digital Engine Electronics", info: null, dtcs: [], liveData: [], actuators: [] },
                        ],
                        chassis: [],
                        body: [],
                    },
                },
            }),
        );

        const loaded = vehicleSystemsStore.getSystems("v-legacy");
        expect(loaded.systems.drivetrain[0].liveData).toHaveLength(DDE_LIVE_DATA.length);
        expect(loaded.seedVersion).toBeGreaterThan(0);

        // user-authored PIDs are never overwritten
        vehicleSystemsStore.mutateSystems("v-legacy", (s) => ({
            ...s,
            systems: {
                ...s.systems,
                drivetrain: [{ ...s.systems.drivetrain[0], liveData: [{ id: makeId(), pid: "KEEP", label: "Keep me", unit: "", base: "1" }] }],
            },
        }));
        const after = vehicleSystemsStore.getSystems("v-legacy");
        expect(after.systems.drivetrain[0].liveData).toHaveLength(1);
        expect(after.systems.drivetrain[0].liveData[0].pid).toBe("KEEP");
    });
});
