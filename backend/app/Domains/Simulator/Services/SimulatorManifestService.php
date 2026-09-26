<?php

namespace App\Domains\Simulator\Services;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use Illuminate\Support\Facades\DB;

/**
 * Single manifest the engine receives — validated, version-pinned.
 * When data_pack_id is null (legacy seed), falls back to diagnostic_scenarios graph.
 */
final class SimulatorManifestService
{
    public function forScenario(DiagnosticScenario $scenario): array
    {
        $scenario->loadMissing(['dataPack.vehicleVariant.model.make', 'steps', 'scoringCriteria', 'hints']);

        $pack = $scenario->dataPack;
        $vehicle = $pack?->vehicleVariant;

        $components = $pack ? DB::table('simulator_components')->where('data_pack_id', $pack->id)->get()->map(fn ($r) => (array) $r)->all() : [];
        $pins = $pack ? DB::table('simulator_pins')->join('simulator_components as c', 'c.id', '=', 'simulator_pins.component_id')->where('c.data_pack_id', $pack->id)->select('simulator_pins.*')->get()->map(fn ($r) => (array) $r)->all() : [];
        $wires = $pack ? DB::table('simulator_wires')->where('data_pack_id', $pack->id)->get()->map(fn ($r) => (array) $r)->all() : [];
        $tasks = $scenario->steps->map(fn ($s) => ['id' => $s->id, 'position' => $s->position, 'title' => $s->title, 'action_type' => $s->action_type->value, 'is_required' => $s->is_required])->all();

        return [
            'scenario' => ['id' => $scenario->id, 'slug' => $scenario->slug, 'version' => $scenario->version ?? 1, 'tool' => 'schematic', 'passing_score' => $scenario->passing_score, 'time_limit' => $scenario->time_limit],
            'vehicle' => $vehicle ? ['variant' => $vehicle->name, 'engine_code' => $vehicle->engine_code, 'pack' => $pack->version] : null,
            'requiredAssets' => $pack ? ['diagram-r16.png'] : [],
            'components' => $components,
            'pins' => $pins,
            'wires' => $wires,
            'tasks' => $tasks,
            'faults' => [],
            'rubric' => ['time_weight' => 0.15, 'accuracy_weight' => 0.5],
        ];
    }
}
