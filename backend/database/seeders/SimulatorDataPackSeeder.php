<?php

namespace Database\Seeders;

use App\Models\SimulatorDataPack;
use App\Models\VehicleVariant;
use Illuminate\Database\Seeder;

/**
 * Seeds default simulator data packs per vehicle variant and tool so
 * fresh installs have publishable environments for every lab. Idempotent.
 *
 * Each variant gets one pack per tool where coverage is ok/avail.
 * Manifests are minimal but valid per InstructorSimulatorController::validateManifest,
 * and are merged over the static front-end datasets via catalog helpers.
 */
class SimulatorDataPackSeeder extends Seeder
{
    public function run(): void
    {
        $variants = VehicleVariant::query()->get();
        if ($variants->isEmpty()) {
            $this->command?->warn('No vehicle variants found — run SimulatorVehicleSeeder first.');
            return;
        }

        $created = 0;
        foreach ($variants as $variant) {
            // Only seed demo packs for the originally seeded vehicles (metadata.seeded), not for custom instructor vehicles
            // Custom vehicles should start as a healthy full copy (no pack) until the instructor adds a fault variant
            if (($variant->metadata['seeded'] ?? false) !== true) {
                continue;
            }
            $coverage = $variant->metadata['coverage'] ?? [];
            foreach (['scanner', 'multimeter', 'oscilloscope', 'location', 'schematic'] as $tool) {
                $cov = $coverage[$tool] ?? 'avail';
                if ($cov === 'none') {
                    continue;
                }
                // If the variant already has any pack for this tool (custom or demo), skip
                $hasToolPack = SimulatorDataPack::query()
                    ->where('vehicle_variant_id', $variant->id)
                    ->get()
                    ->contains(function ($pack) use ($tool) {
                        $manifest = $pack->manifest;
                        if (!is_array($manifest)) return false;
                        foreach ($manifest as $entry) {
                            if (!is_array($entry)) continue;
                            if ($tool === 'scanner' && (isset($entry['nodes']) || isset($entry['dtcs']) || isset($entry['pids']))) return true;
                            if ($tool === 'multimeter' && isset($entry['procedures'])) return true;
                            if ($tool === 'oscilloscope' && isset($entry['exercises'])) return true;
                            if ($tool === 'location' && isset($entry['components'])) {
                                $first = $entry['components'][0] ?? null;
                                if (is_array($first) && isset($first['hot'])) return true;
                            }
                            if ($tool === 'schematic' && (isset($entry['components']) || isset($entry['wires']) || isset($entry['traces']))) {
                                if (isset($entry['wires']) || isset($entry['traces'])) return true;
                                $first = $entry['components'][0] ?? null;
                                if (is_array($first) && isset($first['x']) && !isset($first['hot'])) return true;
                            }
                        }
                        return false;
                    });
                if ($hasToolPack) {
                    continue;
                }
                $code = "{$tool}-demo";
                $manifest = $this->manifestFor($tool);
                SimulatorDataPack::query()->create([
                    'vehicle_variant_id' => $variant->id,
                    'code' => $code,
                    'version' => '1.0.0',
                    'status' => 'published',
                    'manifest' => $manifest,
                    'created_by' => null,
                ]);
                $created++;
            }
        }

        $this->command?->info("Seeded {$created} simulator data packs.");
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function manifestFor(string $tool): array
    {
        return match ($tool) {
            'scanner' => [[
                // Demo fault for the 4 seeded variants only — new custom vehicles start healthy (no pack) until instructor adds one
                'nodes' => [['id' => 'ECM', 'status' => 'fault', 'dtc' => 1]],
                'dtcs' => [['code' => 'P0115', 'desc' => 'Engine Coolant Temp Circuit Malfunction', 'ecu' => 'ECM', 'status' => 'Current', 'severity' => 'high', 'count' => 1]],
                'pids' => [['id' => 'ECT', 'base' => 85, 'fault' => true], ['id' => 'RPM', 'base' => 850, 'fault' => false]],
                'adasDone' => [false, false, true, false, false, false],
                'trainingSessions' => [[
                    'id' => 'demo-sess-01',
                    'title' => 'Demo: Coolant sensor fault',
                    'description' => 'Follow the DTC → live data → graph → tree to isolate the ECT fault.',
                    'steps' => [
                        ['id' => 's1', 'screen' => 'dtc', 'label' => 'Read DTCs'],
                        ['id' => 's2', 'screen' => 'live', 'label' => 'Check ECT live data'],
                        ['id' => 's3', 'screen' => 'graph', 'label' => 'Plot ECT vs IAT'],
                    ],
                    'options' => ['ECT sensor open', 'Thermostat stuck', 'Wiring short', 'ECM fault'],
                    'correctIndex' => 0,
                    'hintBudget' => 2,
                    'passScore' => 70,
                    'weights' => ['accuracy' => 90, 'process' => 85, 'time' => 75],
                ]],
            ]],
            'multimeter' => [[
                'procedures' => [[
                    'ref' => 'B99',
                    'name' => 'Demo: Coolant Temperature Sensor',
                    'group' => 'Engine',
                    'pins' => ['1', '2'],
                    'pinFn' => ['1' => 'Supply', '2' => 'Signal'],
                    'ecu' => ['code' => 'ECU', 'name' => 'Engine ECU', 'pins' => ['A1', 'A2']],
                    'links' => ['1' => 'A1'],
                    'supply' => ['1'],
                    'steps' => [[
                        'mode' => 'VDC',
                        'red' => 'c1',
                        'black' => 'gnd',
                        'spec' => '4.5 - 5.5 V',
                        'good' => '5.02',
                        'bad' => '0.18',
                        'unit' => 'V',
                    ], [
                        'mode' => 'OHM',
                        'red' => 'c1',
                        'black' => 'c2',
                        'spec' => '2.0 - 3.0 kΩ',
                        'good' => '2.45',
                        'bad' => 'OL',
                        'unit' => 'kΩ',
                        'table' => ['head' => ['Temp °C', 'Resistance'], 'rows' => [['20', '2.5k'], ['80', '0.32k']]],
                    ]],
                ]],
            ]],
            'oscilloscope' => [[
                'exercises' => [[
                    'id' => 'inj-demo',
                    'code' => 'INJ-99',
                    'name' => 'Demo: Injector (custom fault)',
                    'period' => 20,
                    'supply' => 12,
                    'openA' => 12,
                    'pk' => 70,
                    'timeDiv' => 2,
                    'chA' => ['label' => 'Injector − (driver)', 'unit' => 'V', 'vdiv' => 10, 'off' => -3, 'colorKey' => 'A'],
                    'chB' => ['label' => 'Current clamp', 'unit' => 'A', 'vdiv' => 1, 'off' => -3, 'colorKey' => 'C'],
                    'trig' => ['level' => 6, 'edge' => 'falling', 'min' => -10, 'max' => 80, 'step' => 1],
                    'connector' => '2-way demo connector',
                    'pins' => [['n' => '1', 'name' => '+12 V supply'], ['n' => '2', 'name' => 'ECU driver']],
                    'ecuPins' => [['n' => '#10', 'name' => 'Injector driver']],
                    'specs' => [['k' => 'Rest voltage', 'v' => '12 - 14 V'], ['k' => 'Pulse width', 'v' => '2.5 - 4 ms']],
                    'correct' => ['A' => '2', 'GND' => 'BAT−', 'CLAMP' => '1'],
                    'faults' => ['none', 'open', 'shortGnd', 'highRes', 'dropout'],
                    'anim' => ['unit' => '%', 'unit2' => 'A'],
                ]],
            ]],
            'location' => [[
                'components' => [[
                    'key' => 'R99',
                    'ref' => 'R99',
                    'name' => 'Demo Relay — Custom Position',
                    'cat' => 'Relays',
                    'kind' => 'relay',
                    'view' => 'sensors',
                    'oem' => 'Demo OEM R99',
                    'sys' => 'Engine Control',
                    'zone' => 'Engine bay',
                    'place' => 'Near battery',
                    'systems' => ['Engine Control'],
                    'img' => '',
                    'hot' => ['x' => 120, 'y' => 80, 'w' => 48, 'h' => 36, 'W' => 1000, 'H' => 636],
                ], [
                    'key' => 'S99',
                    'ref' => 'S99',
                    'name' => 'Demo Sensor — Hotspot Challenge',
                    'cat' => 'Sensors',
                    'kind' => 'sensor',
                    'view' => 'sensors',
                    'oem' => 'Demo OEM S99',
                    'sys' => 'Engine Control',
                    'zone' => 'Engine bay',
                    'place' => 'Intake manifold',
                    'systems' => ['Engine Control'],
                    'img' => '',
                    'hot' => ['x' => 420, 'y' => 220, 'w' => 36, 'h' => 36, 'W' => 1000, 'H' => 636],
                ]],
            ]],
            'schematic' => [[
                'components' => [[
                    'key' => 'R99',
                    'code' => 'R99',
                    'name' => 'Demo Relay (instructor)',
                    'type' => 'relay',
                    'x' => 1200,
                    'y' => 700,
                    'w' => 80,
                    'h' => 40,
                ], [
                    'key' => 'S99',
                    'code' => 'S99',
                    'name' => 'Demo Sensor',
                    'type' => 'sensor',
                    'x' => 1600,
                    'y' => 900,
                    'w' => 70,
                    'h' => 50,
                ]],
                'wires' => [[
                    'ecuPin' => 'A 99',
                    'ecuColour' => 'red/white',
                    'target' => 'R99',
                    'targetPin' => '1',
                    'targetColour' => 'red/white',
                    'connector' => 'A',
                    'mismatch' => false,
                ], [
                    'ecuPin' => 'B 99',
                    'ecuColour' => 'blue',
                    'target' => 'S99',
                    'targetPin' => '2',
                    'targetColour' => 'blue',
                    'connector' => 'B',
                    'mismatch' => false,
                ]],
                'traces' => [[
                    'id' => 'demo-trace',
                    'labelId' => 'schematic.trace.demo',
                    'steps' => [['cmp' => 'R99'], ['cmp' => 'E1']],
                ]],
            ]],
            default => [[]],
        };
    }
}
