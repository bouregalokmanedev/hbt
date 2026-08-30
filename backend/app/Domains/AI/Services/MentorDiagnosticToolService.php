<?php

namespace App\Domains\AI\Services;

use InvalidArgumentException;

/**
 * Deterministic diagnostic helpers. These tools never make repairs or
 * safety-critical decisions; they provide calculations and a safe workflow.
 */
final class MentorDiagnosticToolService
{
    public function voltageDrop(float $sourceVoltage, float $loadVoltage): array
    {
        if ($sourceVoltage <= 0 || $loadVoltage < 0 || $loadVoltage > $sourceVoltage) {
            throw new InvalidArgumentException('Enter a valid source and loaded voltage.');
        }

        $drop = round($sourceVoltage - $loadVoltage, 2);
        $percentage = round(($drop / $sourceVoltage) * 100, 1);

        return [
            'tool' => 'voltage_drop',
            'drop_volts' => $drop,
            'drop_percentage' => $percentage,
            'interpretation' => $percentage <= 3 ? 'Low voltage drop. Continue diagnosis with the course procedure.' : 'Elevated voltage drop. Inspect connections and verify measurements before replacing parts.',
            'safety_note' => 'Use the vehicle service information and appropriate PPE. Never probe an airbag, high-voltage, or safety-critical circuit without approved procedures.',
        ];
    }

    public function diagnosticChecklist(string $symptom): array
    {
        $symptom = trim($symptom);
        if ($symptom === '') throw new InvalidArgumentException('Describe the symptom to create a checklist.');

        return [
            'tool' => 'diagnostic_checklist',
            'symptom' => $symptom,
            'steps' => ['Confirm the customer concern and operating conditions.', 'Check relevant service information, codes, and freeze-frame data.', 'Perform a visual inspection before disconnecting components.', 'Test the circuit or system with measured values.', 'Verify the repair and clear codes only after confirmation.'],
            'safety_note' => 'This is an educational workflow, not a substitute for manufacturer procedures or qualified supervision.',
        ];
    }
}
