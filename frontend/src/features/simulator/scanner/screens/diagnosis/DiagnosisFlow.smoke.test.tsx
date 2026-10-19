import { render, screen, fireEvent, act } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

const { fetchCatalogMock } = vi.hoisted(() => ({ fetchCatalogMock: vi.fn() }));

vi.mock("@/features/simulator/scanner/data/catalog", () => ({
    fetchCatalog: fetchCatalogMock,
}));

import {
    DiagnosisFlow,
    type DiagnosisMenuAction,
} from "./DiagnosisFlow";
import { vehicleSystemsStore } from "@/features/instructor/data/vehicleSystems";

const HONDA_BACKEND = [
    {
        id: "make-honda",
        name: "Honda",
        models: [
            {
                id: "mo-civic",
                name: "Civic",
                variants: [
                    {
                        id: "v-15",
                        name: "1.5 VTEC",
                        engine_code: "L15B",
                        fuel_type: "Gasoline",
                        transmission: "AT",
                        year_from: 2018,
                        year_to: 2022,
                        metadata: { vin: "HG123456" },
                        packs: [
                            { id: "pack1", code: "CIVIC_15", version: "1.2.0", manifest: [] },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "make-toyota",
        name: "Toyota",
        models: [
            {
                id: "mo-camry",
                name: "Camry",
                variants: [
                    {
                        id: "v-20",
                        name: "2.5 Hybrid",
                        engine_code: "A25A",
                        fuel_type: "Hybrid",
                        transmission: "AT",
                        year_from: 2019,
                        year_to: 2024,
                        metadata: { vin: "JT123456" },
                        packs: [
                            { id: "pack2", code: "CAMRY_25", version: "1.2.0", manifest: [] },
                        ],
                    },
                ],
            },
            {
                id: "mo-corolla",
                name: "Corolla",
                variants: [
                    {
                        id: "v-21",
                        name: "1.8 Valvematic",
                        engine_code: "2ZR",
                        fuel_type: "Gasoline",
                        transmission: "CVT",
                        year_from: 2018,
                        year_to: 2023,
                        metadata: { vin: "SB123456" },
                        packs: [
                            { id: "pack3", code: "COROLLA_18", version: "1.2.0", manifest: [] },
                        ],
                    },
                ],
            },
        ],
    },
];

function renderFlow(
    props: Partial<{
        onExit: () => void;
        onMenuAction: (a: DiagnosisMenuAction) => void;
        vciConnected: boolean;
    }> = {},
) {
    return render(
        <I18nextProvider i18n={i18n}>
            <DiagnosisFlow onExit={() => undefined} vciConnected {...props} />
        </I18nextProvider>,
    );
}

/** Vehicle picks open the "check the OBD connection" popup — dismiss it. */
function confirmObdCheck() {
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

beforeEach(() => {
    localStorage.clear();
    vehicleSystemsStore.reset();
    fetchCatalogMock.mockReset();
    fetchCatalogMock.mockResolvedValue(HONDA_BACKEND);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("DiagnosisFlow", () => {
    it("renders the vehicle grid with OBD II and region tabs", async () => {
        renderFlow();

        expect(
            await screen.findByRole("button", { name: /Diagnosis for OBD II/ }),
        ).toBeInTheDocument();
        expect(screen.getAllByText("Diagnosis for").length).toBeGreaterThan(1);
        expect(screen.getByText("HONDA")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Asia" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "My vehicles" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "VIN" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "VCI status" })).toBeInTheDocument();
    });

    it("shows only instructor-authored brands — no static filler vehicles", async () => {
        renderFlow();

        await screen.findByRole("button", { name: /Diagnosis for OBD II/ });
        expect(screen.getByText("HONDA")).toBeInTheDocument();
        expect(screen.getByText("TOYOTA")).toBeInTheDocument();
        // Static bench-dataset brands never appear on the Asia tab…
        expect(screen.queryByText("HYUNDAI")).toBeNull();

        // …and none of them appear on other region tabs either.
        fireEvent.click(screen.getByRole("button", { name: "Europe" }));
        expect(screen.queryByText("VOLKSWAGEN")).toBeNull();
        expect(screen.queryByText("MERCEDES-BENZ")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "America" }));
        expect(screen.queryByText("FORD")).toBeNull();
    });

    it("automatic detection: profile popup → OK → main menu", async () => {
        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Automatic Detection" }));

        expect(screen.getByText("Confirm vehicle profile")).toBeInTheDocument();
        expect(screen.getByText("HG123456")).toBeInTheDocument();
        expect(screen.getByText("Model series")).toBeInTheDocument();
        expect(screen.getByText("Civic")).toBeInTheDocument();
        expect(screen.getByText("Model year")).toBeInTheDocument();
        expect(screen.getByText("2018–2022")).toBeInTheDocument();
        expect(screen.getByText("Transmission")).toBeInTheDocument();
        expect(screen.getByText("AT")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "OK" }));

        expect(screen.getByText("Main menu")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Automatic Scan" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "System Selection" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Quick Read Code" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Quick Clear Code" })).toBeInTheDocument();
        expect(screen.getByText("HONDA V1.2.0 > Automatic Detection")).toBeInTheDocument();
        expect(screen.queryByText("Confirm vehicle profile")).toBeNull();
    });

    it("manual detection skips the profile popup", async () => {
        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Manual Detection" }));

        expect(screen.queryByText("Confirm vehicle profile")).toBeNull();
        expect(screen.getByText("Main menu")).toBeInTheDocument();
        expect(screen.getByText("HONDA V1.2.0 > Manual Detection")).toBeInTheDocument();
    });

    it("OBD II goes straight to the main menu", async () => {
        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for OBD II/ }));
        confirmObdCheck();

        expect(screen.queryByText("Confirm vehicle profile")).toBeNull();
        expect(screen.queryByRole("button", { name: "Automatic Detection" })).toBeNull();
        expect(screen.getByText("OBD II V22.00")).toBeInTheDocument();
        expect(screen.getByText("Main menu")).toBeInTheDocument();
    });

    it("multi-variant brand opens the vehicle chooser", async () => {
        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for TOYOTA/ }));

        expect(screen.getByText("Choose vehicle")).toBeInTheDocument();
        expect(
            screen.getAllByRole("button", { name: /Camry/ }).length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByRole("button", { name: /Corolla/ }).length,
        ).toBeGreaterThan(0);

        // Picking the concrete variant is the real "vehicle pick" → OBD check.
        fireEvent.click(screen.getAllByRole("button", { name: /Camry/ })[0]);
        confirmObdCheck();

        expect(screen.queryByText("Choose vehicle")).toBeNull();
        expect(screen.getByRole("button", { name: "Automatic Detection" })).toBeInTheDocument();
        expect(screen.getByText("TOYOTA V1.2.0")).toBeInTheDocument();
    });

    it("back chain: menu → detection → grid → home", async () => {
        const onExit = vi.fn();
        renderFlow({ onExit });

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Automatic Detection" }));
        fireEvent.click(screen.getByRole("button", { name: "OK" }));

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByRole("button", { name: "Automatic Detection" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(
            await screen.findByRole("button", { name: /Diagnosis for OBD II/ }),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(onExit).toHaveBeenCalledTimes(1);
    });

    it("saves the picked vehicle to My vehicles", async () => {
        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        fireEvent.click(screen.getByRole("button", { name: "My vehicles" }));
        expect(screen.getByText("HONDA")).toBeInTheDocument();
        expect(screen.queryByText("TOYOTA")).toBeNull();
        expect(screen.queryByText("VOLKSWAGEN")).toBeNull();

        const stored: { brandName: string }[] = JSON.parse(
            localStorage.getItem("hbt-scanner-my-vehicles") ?? "[]",
        );
        expect(stored).toHaveLength(1);
        expect(stored[0].brandName).toBe("HONDA");
    });

    it("quick read / quick clear are consumed by the flow, not forwarded", async () => {
        const onMenuAction = vi.fn();
        renderFlow({ onMenuAction });

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Manual Detection" }));

        // Quick Read Code → scan-result screen (empty before any scan).
        fireEvent.click(screen.getByRole("button", { name: "Quick Read Code" }));
        expect(onMenuAction).not.toHaveBeenCalledWith("quickRead");
        expect(screen.getByText("Quick Read Code")).toBeInTheDocument();
        expect(screen.getByText("No fault codes found")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByText("Main menu")).toBeInTheDocument();

        // Quick Clear Code → confirm popup → clears (no scan faults yet).
        fireEvent.click(screen.getByRole("button", { name: "Quick Clear Code" }));
        expect(onMenuAction).not.toHaveBeenCalledWith("quickClear");
        expect(
            screen.getByText("Clear all fault codes found by the automatic scan?"),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        expect(screen.getByText("Main menu")).toBeInTheDocument();
    });

    it("picking a vehicle shows the OBD check popup and blocks Continue while unplugged", async () => {
        renderFlow({ vciConnected: false });

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));

        expect(screen.getByText("Check the OBD connection")).toBeInTheDocument();
        expect(
            screen.getByText("OBD is not connected — plug it in to continue"),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
        expect(screen.queryByText("Main menu")).toBeNull();
        expect(screen.queryByRole("button", { name: "Manual Detection" })).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(screen.queryByText("Check the OBD connection")).toBeNull();
        expect(
            screen.getByRole("button", { name: /Diagnosis for HONDA/ }),
        ).toBeInTheDocument();
    });

    it("System Selection opens the systems screen and drills into ECU cards", async () => {
        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Manual Detection" }));
        fireEvent.click(screen.getByRole("button", { name: "System Selection" }));

        expect(screen.getByText("HONDA V1.2.0 > Main menu")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Drivetrain system/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Chassis system/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Body system/ })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Drivetrain system/ }));

        expect(screen.getByText("HONDA V1.2.0 > Drivetrain system")).toBeInTheDocument();
        expect(screen.getByText("Control units")).toBeInTheDocument();
        expect(screen.getByText("Digital Engine Electronics")).toBeInTheDocument();
        expect(screen.getByText("Transmission Control Unit")).toBeInTheDocument();
        expect(screen.getByText("Car Access System")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByRole("button", { name: /Chassis system/ })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByRole("button", { name: "Quick Clear Code" })).toBeInTheDocument();
    });

    it("ECU card opens the function menu and Read ECU Information shows the instructor data", async () => {
        // Instructor authors ECU info + a DTC for the DDE on this variant.
        const tree = vehicleSystemsStore.getSystems("v-15");
        vehicleSystemsStore.saveSystems({
            ...tree,
            systems: {
                ...tree.systems,
                drivetrain: tree.systems.drivetrain.map((ecu) =>
                    ecu.name === "Digital Engine Electronics"
                        ? {
                              ...ecu,
                              info: {
                                  systemName: "Digital Engine Electronics",
                                  programmingDate: "2018.07.13",
                                  manufactureDate: "04.10.2015",
                                  supplier: "Bosch",
                                  serialNumber: "0170943698",
                              },
                              dtcs: [
                                  {
                                      id: "dtc-1",
                                      code: "P0301",
                                      desc: "Cylinder 1 misfire detected",
                                      severity: "high",
                                  },
                              ],
                          }
                        : ecu,
                ),
            },
        });

        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Manual Detection" }));
        fireEvent.click(screen.getByRole("button", { name: "System Selection" }));
        fireEvent.click(screen.getByRole("button", { name: /Drivetrain system/ }));

        fireEvent.click(screen.getByRole("button", { name: "Digital Engine Electronics" }));

        // ECU function menu (reference layout)
        expect(
            screen.getByText("HONDA V1.2.0 > Drivetrain system > Digital Engine Electronics"),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Read ECU Information" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Read DTC" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Clear DTC" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Live Data" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Actuator Tests" })).toBeInTheDocument();

        // Read ECU Information → instructor-authored rows
        fireEvent.click(screen.getByRole("button", { name: "Read ECU Information" }));
        expect(screen.getByText("System Name:")).toBeInTheDocument();
        expect(screen.getByText("2018.07.13")).toBeInTheDocument();
        expect(screen.getByText("04.10.2015")).toBeInTheDocument();
        expect(screen.getByText("Bosch")).toBeInTheDocument();
        expect(screen.getByText("0170943698")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        expect(screen.queryByText("2018.07.13")).toBeNull();

        // Read DTC → always no-fault until an automatic scan has run
        fireEvent.click(screen.getByRole("button", { name: "Read DTC" }));
        expect(
            screen.getByText("No fault codes — run an automatic scan to check this unit"),
        ).toBeInTheDocument();
        expect(screen.queryByText("P0301")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        // Clear DTC → confirm → done
        fireEvent.click(screen.getByRole("button", { name: "Clear DTC" }));
        expect(
            screen.getByText("Clear all stored fault codes in this control unit?"),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        expect(screen.getByText("Fault codes cleared")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "OK" }));

        // Live Data → separate real-time screen with Name/Value/Unit rows.
        fireEvent.click(screen.getByRole("button", { name: "Live Data" }));
        expect(screen.getByText("Engine speed")).toBeInTheDocument();
        expect(screen.getByText("2479.75")).toBeInTheDocument();
        expect(screen.getByText("1/min")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        // Back to the ECU grid
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(
            screen.getByRole("button", { name: "Digital Engine Electronics" }),
        ).toBeInTheDocument();
    });

    it("automatic scan reveals ECUs one by one with randomized faults, DTC list, clear and Diagnostic", async () => {
        const onMenuAction = vi.fn();
        // Instructor authors DTCs for two ECUs — the scan may or may not show them.
        const tree = vehicleSystemsStore.getSystems("v-15");
        vehicleSystemsStore.saveSystems({
            ...tree,
            systems: {
                ...tree.systems,
                drivetrain: tree.systems.drivetrain.map((ecu) =>
                    ecu.name === "Digital Engine Electronics"
                        ? {
                              ...ecu,
                              dtcs: [
                                  {
                                      id: "d1",
                                      code: "P0301",
                                      desc: "Cylinder 1 misfire detected",
                                      severity: "high",
                                  },
                              ],
                          }
                        : ecu,
                ),
                body: tree.systems.body.map((ecu) =>
                    ecu.name === "Air Conditioning System"
                        ? {
                              ...ecu,
                              dtcs: [
                                  {
                                      id: "d2",
                                      code: "80118B",
                                      desc: "A/C compressor shut-down",
                                      severity: "medium",
                                  },
                              ],
                          }
                        : ecu,
                ),
            },
        });
        // Force every authored-DTC ECU to report a fault on this scan.
        vi.spyOn(Math, "random").mockReturnValue(0.1);

        renderFlow({ onMenuAction });

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Manual Detection" }));

        // ECUs appear one by one (25 ECUs × 400 ms) — drive the timers.
        expect(screen.getByRole("button", { name: "Automatic Scan" })).toBeInTheDocument();
        vi.useFakeTimers();
        try {
            fireEvent.click(screen.getByRole("button", { name: "Automatic Scan" }));
            expect(onMenuAction).not.toHaveBeenCalledWith("autoScan");
            expect(screen.queryByText(/Digital Engine Electronics/)).toBeNull();
            for (let i = 0; i < 30; i++) {
                act(() => {
                    vi.advanceTimersByTime(400);
                });
            }
        } finally {
            vi.useRealTimers();
        }

        // Two faulty rows ("Fault|1"), the rest pass — faults sorted to the top
        // and renumbered by display order.
        const faultToggles = screen.getAllByRole("button", { name: "Fault|1" });
        expect(faultToggles).toHaveLength(2);
        expect(screen.getAllByText("Pass | No DTC").length).toBeGreaterThan(15);
        const rowLabels = screen
            .getAllByText(/^\d+\. /)
            .map((el) => el.textContent);
        expect(rowLabels[0]).toBe("1. Digital Engine Electronics");
        expect(rowLabels[1]).toBe("2. Air Conditioning System");
        // Third row is a pass ECUs — faults sort above every pass.
        expect(rowLabels[2]).not.toMatch(/Fault/);

        // Expand the first fault row (Digital Engine Electronics) → its codes.
        fireEvent.click(faultToggles[0]);
        expect(screen.getByText("P0301")).toBeInTheDocument();
        expect(screen.getByText("Cylinder 1 misfire detected")).toBeInTheDocument();

        // DTC List → single screen with every code found (incl. severity).
        fireEvent.click(screen.getByRole("button", { name: "DTC List" }));
        expect(screen.getByText("80118B")).toBeInTheDocument();
        expect(screen.getByText("A/C compressor shut-down")).toBeInTheDocument();
        expect(screen.getByText("high")).toBeInTheDocument();
        expect(screen.getByText("medium")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        // DTC Report → full report page with header and fault table.
        fireEvent.click(screen.getByRole("button", { name: "DTC Report" }));
        expect(screen.getByText("Report")).toBeInTheDocument();
        expect(screen.getByText("Vehicle Information")).toBeInTheDocument();
        expect(screen.getByText("Fault Codes")).toBeInTheDocument();
        expect(screen.getByText("Digital Engine Electronics")).toBeInTheDocument();
        expect(screen.getByText("Air Conditioning System")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Exit" })).toBeInTheDocument();
        // Save persists the report to the tablet store and flips to "Saved".
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
        const savedRaw = localStorage.getItem("hbt:scanner-reports");
        expect(savedRaw).toBeTruthy();
        const savedList = JSON.parse(savedRaw as string) as Array<{
            vehicleName: string;
            codeCount: number;
            faults: Record<string, unknown[]>;
        }>;
        expect(savedList).toHaveLength(1);
        expect(savedList[0].vehicleName).toBe("Civic");
        expect(savedList[0].codeCount).toBe(2);
        expect(Object.keys(savedList[0].faults)).toHaveLength(2);
        fireEvent.click(screen.getByRole("button", { name: "Exit" }));

        // Diagnostic on the first row → ECU menu → Read DTC shows the codes.
        fireEvent.click(screen.getAllByRole("button", { name: "Diagnostic" })[0]);
        expect(
            screen.getByText(
                "HONDA V1.2.0 > Manual Detection > Digital Engine Electronics",
            ),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Read DTC" }));
        expect(screen.getByText("P0301")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        // Clear All DTCs → everything passes, DTC List disabled.
        fireEvent.click(screen.getByRole("button", { name: "Clear All DTCs" }));
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        expect(screen.queryByText("Fault|1")).toBeNull();
        expect(screen.getByRole("button", { name: "DTC List" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Clear All DTCs" })).toBeDisabled();

        // Read DTC via Diagnostic is now empty again.
        fireEvent.click(screen.getAllByRole("button", { name: "Diagnostic" })[0]);
        fireEvent.click(screen.getByRole("button", { name: "Read DTC" }));
        expect(
            screen.getByText("No fault codes — run an automatic scan to check this unit"),
        ).toBeInTheDocument();
    });

    it("Clear DTC inside the ECU menu clears only that unit's scan faults", async () => {
        const tree = vehicleSystemsStore.getSystems("v-15");
        vehicleSystemsStore.saveSystems({
            ...tree,
            systems: {
                ...tree.systems,
                drivetrain: tree.systems.drivetrain.map((ecu) =>
                    ecu.name === "Digital Engine Electronics"
                        ? {
                              ...ecu,
                              dtcs: [
                                  {
                                      id: "d1",
                                      code: "P0301",
                                      desc: "Cylinder 1 misfire detected",
                                      severity: "high",
                                  },
                              ],
                          }
                        : ecu,
                ),
                body: tree.systems.body.map((ecu) =>
                    ecu.name === "Air Conditioning System"
                        ? {
                              ...ecu,
                              dtcs: [
                                  {
                                      id: "d2",
                                      code: "80118B",
                                      desc: "A/C compressor shut-down",
                                      severity: "medium",
                                  },
                              ],
                          }
                        : ecu,
                ),
            },
        });
        vi.spyOn(Math, "random").mockReturnValue(0.1);

        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Manual Detection" }));

        vi.useFakeTimers();
        try {
            fireEvent.click(screen.getByRole("button", { name: "Automatic Scan" }));
            for (let i = 0; i < 30; i++) {
                act(() => {
                    vi.advanceTimersByTime(400);
                });
            }
        } finally {
            vi.useRealTimers();
        }

        // Diagnostic on DDE → Clear DTC in the ECU menu.
        fireEvent.click(screen.getAllByRole("button", { name: "Diagnostic" })[0]);
        fireEvent.click(screen.getByRole("button", { name: "Clear DTC" }));
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        // Only the A/C fault remains.
        const faultToggles = screen.getAllByRole("button", { name: "Fault|1" });
        expect(faultToggles).toHaveLength(1);
        const rowLabels = screen
            .getAllByText(/^\d+\. /)
            .map((el) => el.textContent);
        expect(rowLabels[0]).toBe("1. Air Conditioning System");

        // DDE's Read DTC is now empty while A/C still shows its code.
        // Sorted: [A/C (fault), DDE, TCU, …] — DDE is the second Diagnostic.
        fireEvent.click(screen.getAllByRole("button", { name: "Diagnostic" })[1]);
        fireEvent.click(screen.getByRole("button", { name: "Read DTC" }));
        expect(
            screen.getByText("No fault codes — run an automatic scan to check this unit"),
        ).toBeInTheDocument();
    });

    it("System Selection is consumed by the flow, not forwarded to onMenuAction", async () => {
        const onMenuAction = vi.fn();
        renderFlow({ onMenuAction });

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Manual Detection" }));
        fireEvent.click(screen.getByRole("button", { name: "System Selection" }));

        expect(onMenuAction).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: /Body system/ })).toBeInTheDocument();
    });

    it("expanded fault rows show the instructor's teaching note", async () => {
        const tree = vehicleSystemsStore.getSystems("v-15");
        vehicleSystemsStore.saveSystems({
            ...tree,
            systems: {
                ...tree.systems,
                drivetrain: tree.systems.drivetrain.map((ecu) =>
                    ecu.name === "Digital Engine Electronics"
                        ? {
                              ...ecu,
                              dtcs: [
                                  {
                                      id: "d1",
                                      code: "P0301",
                                      desc: "Cylinder 1 misfire detected",
                                      severity: "high",
                                      note: "Check spark plugs and ignition coils before condemning the injector.",
                                  },
                              ],
                          }
                        : ecu,
                ),
            },
        });
        vi.spyOn(Math, "random").mockReturnValue(0.1);

        renderFlow();

        fireEvent.click(await screen.findByRole("button", { name: /Diagnosis for HONDA/ }));
        confirmObdCheck();
        fireEvent.click(screen.getByRole("button", { name: "Manual Detection" }));

        vi.useFakeTimers();
        try {
            fireEvent.click(screen.getByRole("button", { name: "Automatic Scan" }));
            for (let i = 0; i < 30; i++) {
                act(() => {
                    vi.advanceTimersByTime(400);
                });
            }
        } finally {
            vi.useRealTimers();
        }

        // Expand the DDE fault row → the teaching note appears under it.
        fireEvent.click(screen.getAllByRole("button", { name: "Fault|1" })[0]);
        expect(screen.getByText("P0301")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Check spark plugs and ignition coils before condemning the injector.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByText("Note:")).toBeInTheDocument();
    });
});
