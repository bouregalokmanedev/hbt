<?php

namespace App\Domains\Simulator\Controllers;

use App\Models\SimulatorDataPack;
use App\Models\VehicleMake;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Student-facing simulator catalogue: published fault variants merged over
 * the static bench dataset by the lab. Read-only.
 */
class StudentSimulatorCatalogController
{
    public function vehicles(Request $request): JsonResponse
    {
        $makes = VehicleMake::query()
            ->with(['models.variants.dataPacks' => fn ($q) => $q->where('status', 'published')])
            ->orderBy('name')
            ->get()
            ->map(fn (VehicleMake $make) => [
                'id' => $make->id,
                'name' => $make->name,
                'models' => $make->models->map(fn ($model) => [
                    'id' => $model->id,
                    'name' => $model->name,
                    'variants' => $model->variants->map(fn ($variant) => [
                        'id' => $variant->id,
                        'name' => $variant->name,
                        'engine_code' => $variant->engine_code,
                        'fuel_type' => $variant->fuel_type,
                        'transmission' => $variant->transmission,
                        'year_from' => $variant->year_from,
                        'year_to' => $variant->year_to,
                        'metadata' => $variant->metadata,
                        'packs' => $variant->dataPacks->map(fn (SimulatorDataPack $pack) => [
                            'id' => $pack->id,
                            'code' => $pack->code,
                            'version' => $pack->version,
                            'manifest' => $pack->manifest,
                        ])->values(),
                    ])->values(),
                ])->values(),
            ])->values();

        return response()->json(['data' => $makes]);
    }

    /**
     * Published training sessions for a tool, flattened for the student lab.
     * Each item carries its pack + vehicle context so the lab can attribute
     * and scope sessions without extra round-trips.
     */
    public function trainingSessions(Request $request): JsonResponse
    {
        $tool = $request->query('tool', 'scanner');

        $sessions = SimulatorDataPack::query()
            ->with(['vehicleVariant.model.make'])
            ->where('status', 'published')
            ->latest()
            ->get()
            ->flatMap(function (SimulatorDataPack $pack) use ($tool) {
                $variant = $pack->vehicleVariant;
                if (!$variant) return [];
                $entries = is_array($pack->manifest) ? $pack->manifest : [];
                $out = [];
                foreach ($entries as $entry) {
                    foreach ($entry['trainingSessions'] ?? [] as $session) {
                        if (!is_array($session) || !isset($session['id'], $session['title'])) continue;
                        $out[] = [
                            'id' => $session['id'],
                            'title' => $session['title'],
                            'description' => $session['description'] ?? null,
                            'steps' => $session['steps'] ?? [],
                            'options' => $session['options'] ?? [],
                            'correctIndex' => $session['correctIndex'] ?? 0,
                            'hintBudget' => $session['hintBudget'] ?? null,
                            'passScore' => $session['passScore'] ?? null,
                            'weights' => $session['weights'] ?? null,
                            'pack' => ['id' => $pack->id, 'code' => $pack->code, 'version' => $pack->version],
                            'vehicle' => [
                                'variant_id' => $variant->id,
                                'name' => $variant->name,
                                'engine_code' => $variant->engine_code,
                                'make' => $variant->model?->make?->name,
                                'model' => $variant->model?->name,
                            ],
                            'tool' => $tool,
                        ];
                    }
                }
                return $out;
            })
            ->values();

        return response()->json(['data' => $sessions]);
    }
}
