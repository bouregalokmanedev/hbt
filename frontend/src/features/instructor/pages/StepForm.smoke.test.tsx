import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { StepForm } from "./InstructorDiagnosticsPage";
import type { InstructorDiagnosticStep } from "../api/instructorApi";

function renderWithI18n(ui: React.ReactElement) {
    return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

const baseStep: InstructorDiagnosticStep = {
    id: "s1",
    position: 1,
    title: "Measure sensor voltage",
    description: null,
    action_type: "measure",
    tool: "multimeter",
    configuration: {
        component_ref: "A1",
        required_mode: "VDC",
        red_target: "c1",
        black_target: "gnd",
        expected_min: 12,
        expected_max: 14.4,
        unit: "V",
        correct_action: "measure",
    },
    evidence: null,
    duration_seconds: 120,
    discipline: "electrical",
    is_required: true,
    is_terminal: false,
};

describe("StepForm multimeter config (smoke)", () => {
    it("loads mm fields from configuration and rebuilds on save", async () => {
        const onSaved = vi.fn();
        const onCancel = vi.fn();

        renderWithI18n(
            <StepForm initial={baseStep} onCancel={onCancel} onSaved={onSaved} />,
        );

        // Section header + mm fields present when tool=multimeter
        expect(screen.getByText("Multimeter setup (auto-graded)")).toBeInTheDocument();
        expect(screen.getByLabelText(/Component ref/i)).toHaveValue("A1");
        expect(screen.getByLabelText(/Required dial mode/i)).toHaveValue("VDC");
        expect(screen.getByLabelText(/Red probe target/i)).toHaveValue("c1");
        expect(screen.getByLabelText(/Black probe target/i)).toHaveValue("gnd");
        // number inputs report numeric values under jest-dom
        expect(screen.getByLabelText(/Expected min/i)).toHaveValue(12);
        expect(screen.getByLabelText(/Expected max/i)).toHaveValue(14.4);
        expect(screen.getByLabelText(/^Unit/i)).toHaveValue("V");

        // Edit a field, then save
        fireEvent.change(screen.getByLabelText(/Component ref/i), {
            target: { value: "H3" },
        });
        fireEvent.change(screen.getByLabelText(/Expected min/i), {
            target: { value: "4.5" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Save step/i }));

        await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
        const payload = onSaved.mock.calls[0][0];
        expect(payload.tool).toBe("multimeter");
        expect(payload.configuration).toMatchObject({
            component_ref: "H3",
            required_mode: "VDC",
            red_target: "c1",
            black_target: "gnd",
            expected_min: 4.5,
            expected_max: 14.4,
            unit: "V",
            correct_action: "measure", // legacy key preserved
        });
    });

    it("hides mm section when tool is not multimeter and strips mm keys", async () => {
        const onSaved = vi.fn();
        renderWithI18n(
            <StepForm
                initial={{ ...baseStep, tool: "scanner" }}
                onCancel={() => {}}
                onSaved={onSaved}
            />,
        );

        expect(screen.queryByText("Multimeter setup (auto-graded)")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Save step/i }));
        await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
        const cfg = onSaved.mock.calls[0][0].configuration as Record<string, unknown>;
        expect(cfg.component_ref).toBeUndefined();
        expect(cfg.required_mode).toBeUndefined();
        expect(cfg.correct_action).toBe("measure");
    });
});
