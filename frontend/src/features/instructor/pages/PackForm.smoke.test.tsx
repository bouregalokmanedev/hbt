import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { PackForm } from "./InstructorSimulatorPage";
import type { SimFaultPack } from "../api/simulatorBuilder.api";

function renderWithI18n(ui: React.ReactElement) {
    return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

const mmPack: SimFaultPack = {
    id: "p1",
    vehicle_variant_id: "v1",
    code: "mm-pack",
    version: "1.0.0",
    status: "draft",
    manifest: [
        {
            procedures: [
                {
                    ref: "A1",
                    code: "A1",
                    name: "Injector 1",
                    group: "Air & fuel",
                    sym: "inj",
                    pins: ["1", "2"],
                    pinFn: { 1: "Supply", 2: "Earth" },
                    ecu: { code: "E1", name: "Engine control unit", pins: ["A1"] },
                    links: { 2: "B20" },
                    supply: ["1"],
                    steps: [
                        { mode: "VDC", red: "c1", black: "gnd", spec: "12 – 14.4 V", good: "13.2", bad: "0.1", unit: "V" },
                    ],
                },
            ],
        },
    ],
    created_by: 1,
    updated_at: null,
};

describe("PackForm multimeter procedure editor (smoke)", () => {
    it("lists existing procedures and can add a new one", async () => {
        const onSaved = vi.fn();
        const onError = vi.fn();

        renderWithI18n(
            <PackForm
                variantId="v1"
                initial={mmPack}
                onClose={() => {}}
                onSaved={onSaved}
                onError={onError}
            />,
        );

        // Existing procedure listed
        expect(screen.getByText("Multimeter Procedures — 1 in pack")).toBeInTheDocument();
        expect(screen.getByText("Injector 1")).toBeInTheDocument();
        expect(screen.getByText("A1")).toBeInTheDocument();

        // Draft editor visible
        expect(screen.getByPlaceholderText("A1")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Add procedure/i })).toBeInTheDocument();

        // Fill draft and add
        fireEvent.change(screen.getByPlaceholderText("A1"), { target: { value: "L3" } });
        fireEvent.change(screen.getByPlaceholderText("Injector 1"), {
            target: { value: "Mass airflow meter" },
        });

        const addBtn = screen.getByRole("button", { name: /Add procedure/i });
        expect(addBtn).toBeEnabled();
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(screen.getByText("Multimeter Procedures — 2 in pack")).toBeInTheDocument();
        });
        expect(screen.getByText("Mass airflow meter")).toBeInTheDocument();
        expect(screen.getByText("L3")).toBeInTheDocument();
    });

    it("errors when saving multimeter pack with zero procedures", async () => {
        // Empty procedures via null initial + tool inferred as scanner — force mm path
        // by providing empty procedures array after infer would say scanner.
        // Instead: pack with procedures key present but empty list.
        const emptyMm: SimFaultPack = {
            ...mmPack,
            manifest: [{ procedures: [] }],
        };
        const onError = vi.fn();
        const onSaved = vi.fn();

        renderWithI18n(
            <PackForm
                variantId="v1"
                initial={emptyMm}
                onClose={() => {}}
                onSaved={onSaved}
                onError={onError}
            />,
        );

        expect(screen.getByText("Multimeter Procedures — 0 in pack")).toBeInTheDocument();
        expect(screen.getByText("No procedures yet.")).toBeInTheDocument();

        // Click Save variant (packForm.saveVariant)
        fireEvent.click(screen.getByRole("button", { name: /^Save variant$/i }));

        await waitFor(() => {
            expect(screen.getByText("Add at least one procedure.")).toBeInTheDocument();
        });
        expect(onSaved).not.toHaveBeenCalled();
    });

    it("resolves packForm.needExercises / needComponents under packForm (i18n nesting)", () => {
        expect(i18n.t("instructor.simulator.packForm.needProcedures")).toBe(
            "Add at least one procedure.",
        );
        expect(i18n.t("instructor.simulator.packForm.needExercises")).toBe(
            "Add at least one exercise.",
        );
        expect(i18n.t("instructor.simulator.packForm.needComponents")).toBe(
            "Add at least one component.",
        );
        // Not the raw key path (would mean missing translation)
        expect(i18n.t("instructor.simulator.packForm.needExercises")).not.toBe(
            "instructor.simulator.packForm.needExercises",
        );
    });
});
