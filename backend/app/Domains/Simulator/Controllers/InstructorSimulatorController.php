<?php

namespace App\Domains\Simulator\Controllers;

use App\Models\SimulatorDataPack;
use App\Models\VehicleMake;
use App\Models\VehicleModel;
use App\Models\VehicleVariant;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InstructorSimulatorController
{
    use AuthorizesRequests;

    public function vehicles(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SimulatorDataPack::class);

        $makes = VehicleMake::query()
            ->with(['models.variants'])
            ->orderBy('name')
            ->get()
            ->map(fn (VehicleMake $make) => [
                'id' => $make->id,
                'name' => $make->name,
                'slug' => $make->slug,
                'models' => $make->models->map(fn (VehicleModel $model) => [
                    'id' => $model->id,
                    'name' => $model->name,
                    'variants' => $model->variants->map(fn (VehicleVariant $variant) => $this->serializeVariant($variant)),
                ])->values(),
            ])->values();

        return response()->json(['data' => $makes]);
    }

    public function storeVariant(Request $request): JsonResponse
    {
        $this->authorize('create', SimulatorDataPack::class);

        $data = $request->validate([
            'make_name' => ['required', 'string', 'max:120'],
            'model_name' => ['required', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:120'],
            'engine_code' => ['nullable', 'string', 'max:60'],
            'fuel_type' => ['nullable', 'string', 'max:60'],
            'transmission' => ['nullable', 'string', 'max:60'],
            'year_from' => ['nullable', 'integer', 'min:1980', 'max:2035'],
            'year_to' => ['nullable', 'integer', 'min:1980', 'max:2035'],
            'vin' => ['nullable', 'string', 'max:32'],
            'odometer_km' => ['nullable', 'integer', 'min:0'],
            'coverage' => ['nullable', 'array'],
            'coverage.scanner' => ['nullable', 'string', 'in:ok,avail,none'],
            'coverage.multimeter' => ['nullable', 'string', 'in:ok,avail,none'],
            'coverage.oscilloscope' => ['nullable', 'string', 'in:ok,avail,none'],
            'coverage.location' => ['nullable', 'string', 'in:ok,avail,none'],
            'coverage.schematic' => ['nullable', 'string', 'in:ok,avail,none'],
        ]);

        $make = VehicleMake::query()->firstOrCreate(
            ['slug' => Str::slug($data['make_name'])],
            ['name' => $data['make_name']],
        );
        $model = VehicleModel::query()->firstOrCreate(
            ['make_id' => $make->id, 'slug' => Str::slug($data['model_name'])],
            ['name' => $data['model_name']],
        );

        $variant = VehicleVariant::query()->create([
            'model_id' => $model->id,
            'name' => $data['name'],
            'engine_code' => $data['engine_code'] ?? null,
            'fuel_type' => $data['fuel_type'] ?? null,
            'transmission' => $data['transmission'] ?? null,
            'year_from' => $data['year_from'] ?? null,
            'year_to' => $data['year_to'] ?? null,
            'metadata' => array_filter([
                'custom' => true,
                'created_by' => $request->user()->id,
                'vin' => $data['vin'] ?? null,
                'odometer_km' => $data['odometer_km'] ?? null,
                'coverage' => $data['coverage'] ?? ['scanner' => 'avail'],
            ]),
        ]);

        return response()->json(['data' => $this->serializeVariant($variant->fresh())], 201);
    }

    public function updateVariant(Request $request, VehicleVariant $variant): JsonResponse
    {
        // Any instructor may update any vehicle (seeded or custom).
        $this->authorize('create', SimulatorDataPack::class);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'engine_code' => ['sometimes', 'nullable', 'string', 'max:60'],
            'fuel_type' => ['sometimes', 'nullable', 'string', 'max:60'],
            'transmission' => ['sometimes', 'nullable', 'string', 'max:60'],
            'year_from' => ['sometimes', 'nullable', 'integer', 'min:1980', 'max:2035'],
            'year_to' => ['sometimes', 'nullable', 'integer', 'min:1980', 'max:2035'],
            'vin' => ['sometimes', 'nullable', 'string', 'max:32'],
            'odometer_km' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'coverage' => ['sometimes', 'nullable', 'array'],
            'coverage.scanner' => ['nullable', 'string', 'in:ok,avail,none'],
            'coverage.multimeter' => ['nullable', 'string', 'in:ok,avail,none'],
            'coverage.oscilloscope' => ['nullable', 'string', 'in:ok,avail,none'],
            'coverage.location' => ['nullable', 'string', 'in:ok,avail,none'],
            'coverage.schematic' => ['nullable', 'string', 'in:ok,avail,none'],
        ]);

        $metadata = $variant->metadata ?? [];
        foreach (['vin', 'odometer_km', 'coverage'] as $key) {
            if (array_key_exists($key, $data)) $metadata[$key] = $data[$key];
        }

        $variant->update(array_merge(
            collect($data)->only(['name', 'engine_code', 'fuel_type', 'transmission', 'year_from', 'year_to'])->all(),
            ['metadata' => $metadata],
        ));

        return response()->json(['data' => $this->serializeVariant($variant->fresh())]);
    }

    public function packs(Request $request, VehicleVariant $variant): JsonResponse
    {
        $this->authorize('viewAny', SimulatorDataPack::class);

        $packs = SimulatorDataPack::query()
            ->where('vehicle_variant_id', $variant->id)
            ->where(fn ($q) => $q->where('created_by', $request->user()->id)->orWhere('status', 'published'))
            ->latest()
            ->get()
            ->map(fn (SimulatorDataPack $pack) => $this->serializePack($pack));

        return response()->json(['data' => $packs]);
    }

    public function storePack(Request $request, VehicleVariant $variant): JsonResponse
    {
        $this->authorize('create', SimulatorDataPack::class);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:60'],
            'version' => ['required', 'string', 'max:20'],
            'manifest' => ['required', 'array'],
        ]);
        $this->validateManifest($data['manifest']);

        $pack = SimulatorDataPack::query()->create([
            'vehicle_variant_id' => $variant->id,
            'code' => $data['code'],
            'version' => $data['version'],
            'status' => 'draft',
            'manifest' => $data['manifest'],
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $this->serializePack($pack)], 201);
    }

    public function updatePack(Request $request, SimulatorDataPack $pack): JsonResponse
    {
        $this->authorize('update', $pack);

        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:60'],
            'version' => ['sometimes', 'string', 'max:20'],
            'manifest' => ['sometimes', 'array'],
        ]);
        if (isset($data['manifest'])) $this->validateManifest($data['manifest']);

        $pack->update($data);

        return response()->json(['data' => $this->serializePack($pack->fresh())]);
    }

    public function submitPack(Request $request, SimulatorDataPack $pack): JsonResponse
    {
        $this->authorize('submit', $pack);
        $pack->update(['status' => 'submitted']);

        return response()->json(['data' => $this->serializePack($pack->fresh())]);
    }

    public function reviewQueue(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SimulatorDataPack::class);

        $packs = SimulatorDataPack::query()
            ->with('vehicleVariant')
            ->where('status', 'submitted')
            ->latest()
            ->get()
            ->map(fn (SimulatorDataPack $pack) => $this->serializePack($pack, true));

        return response()->json(['data' => $packs]);
    }

    public function approvePack(Request $request, SimulatorDataPack $pack): JsonResponse
    {
        $this->authorize('review', $pack);
        $pack->update(['status' => 'published']);

        return response()->json(['data' => $this->serializePack($pack->fresh())]);
    }

    public function rejectPack(Request $request, SimulatorDataPack $pack): JsonResponse
    {
        $this->authorize('review', $pack);
        $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $pack->update(['status' => 'rejected']);

        return response()->json(['data' => $this->serializePack($pack->fresh())]);
    }

    public function archivePack(Request $request, SimulatorDataPack $pack): JsonResponse
    {
        $this->authorize('archive', $pack);
        $pack->update(['status' => 'archived']);

        return response()->json(['data' => $this->serializePack($pack->fresh())]);
    }

    public function restorePack(Request $request, SimulatorDataPack $pack): JsonResponse
    {
        $this->authorize('restore', $pack);
        $pack->update(['status' => 'draft']);

        return response()->json(['data' => $this->serializePack($pack->fresh())]);
    }

    public function destroyPack(Request $request, SimulatorDataPack $pack): JsonResponse
    {
        $this->authorize('delete', $pack);
        $pack->delete();

        return response()->json(['data' => ['success' => true]]);
    }

    public function destroyVariant(Request $request, VehicleVariant $variant): JsonResponse
    {
        $this->authorize('create', SimulatorDataPack::class);
        $isOwner = ($variant->metadata['created_by'] ?? null) === $request->user()->id;
        $isAdmin = $request->user()->hasAnyRole(['Admin', 'Super Admin']);
        abort_unless(
            ($variant->metadata['custom'] ?? false) === true && ($isOwner || $isAdmin),
            403,
        );
        abort_if(
            $variant->dataPacks()->whereIn('status', ['published', 'archived'])->exists(),
            422,
            'Vehicles with published history cannot be deleted — archive keeps the record.',
        );
        $variant->dataPacks()->delete();
        $variant->delete();

        return response()->json(['data' => ['success' => true]]);
    }

    /**
     * Manifest shape (v2): per-tool overrides merged over the static dataset.
     * Scanner: [{ nodes: [{id,status,dtc}], dtcs: [...], pids: [...], adasDone: bool[6], trainingSessions: [...], dtcDetails: { CODE: { meaning?, causes?, live?, repair? } } }]
     * Multimeter: [{ procedures: [{ ref, name, group, pins, pinFn, ecu, links, supply, steps: [{mode,red,black,spec,good,bad,unit}] }] }]
     * Oscilloscope: [{ exercises: [{ id, code, name, period, supply, faults, chA, trig, ... }] }]
     * Location: [{ components: [{ key, ref, name, cat, kind, view, hot: {x,y,w,h,W,H} }] }]
     * Schematic: [{ components, wires, traces, tasks, exam }]
     * Generic entries with unknown keys are accepted (light validation) to allow instructor experimentation.
     */
    private const TRAINING_SCREENS = ['network', 'systems', 'dtc', 'live', 'graph', 'tree', 'training', 'adas'];

    private function validateManifest(array $manifest): void
    {
        abort_unless(is_array($manifest) && $manifest !== [], 422, 'Manifest must be a non-empty array.');
        foreach ($manifest as $entry) {
            abort_unless(is_array($entry), 422, 'Each manifest entry must be an object.');
            // Scanner
            foreach ($entry['nodes'] ?? [] as $node) {
                abort_unless(
                    isset($node['id'], $node['status'], $node['dtc'])
                        && in_array($node['status'], ['normal', 'fault', 'warn', 'none', 'offline'], true),
                    422,
                    'Node entries need id, status and dtc.',
                );
            }
            foreach ($entry['dtcs'] ?? [] as $dtc) {
                abort_unless(
                    isset($dtc['code'], $dtc['ecu'], $dtc['status'])
                        && in_array($dtc['status'], ['Current', 'Stored', 'Pending', 'Intermittent'], true),
                    422,
                    'DTC entries need code, ecu and status.',
                );
            }
            if (array_key_exists('tree', $entry) && $entry['tree'] !== null) {
                abort_unless(is_array($entry['tree']), 422, 'Fault tree must be an array of steps.');
                foreach ($entry['tree'] as $step) {
                    abort_unless(
                        is_array($step)
                            && isset($step['id'], $step['label'], $step['measure'], $step['expected'], $step['ok'])
                            && is_string($step['id']) && $step['id'] !== ''
                            && is_bool($step['ok'])
                            && (!array_key_exists('terminal', $step) || is_bool($step['terminal'])),
                        422,
                        'Tree steps need id, label, measure, expected and ok.',
                    );
                }
            }
            if (array_key_exists('dtcDetails', $entry) && $entry['dtcDetails'] !== null) {
                $details = $entry['dtcDetails'];
                abort_unless(
                    is_array($details) && ($details === [] || ! array_is_list($details)),
                    422,
                    'dtcDetails must be an object keyed by DTC code.',
                );
                foreach ($details as $code => $detail) {
                    abort_unless(is_string($code) && $code !== '' && is_array($detail), 422, 'Each dtcDetails entry must be an object keyed by a DTC code.');
                    if (array_key_exists('meaning', $detail)) {
                        abort_unless(is_string($detail['meaning']), 422, 'dtcDetails meaning must be a string.');
                    }
                    if (array_key_exists('repair', $detail)) {
                        abort_unless(is_array($detail['repair']), 422, 'dtcDetails repair must be an object.');
                        foreach (['decision', 'evidence', 'doNotStop'] as $repairField) {
                            if (array_key_exists($repairField, $detail['repair'])) {
                                abort_unless(is_string($detail['repair'][$repairField]), 422, 'dtcDetails repair fields must be strings.');
                            }
                        }
                    }
                    foreach ($detail['causes'] ?? [] as $cause) {
                        abort_unless(
                            is_array($cause) && isset($cause['label']) && is_string($cause['label'])
                                && (! array_key_exists('note', $cause) || is_string($cause['note']))
                                && (! array_key_exists('pct', $cause) || is_numeric($cause['pct'])),
                            422,
                            'dtcDetails causes need a label, optional note and numeric pct.',
                        );
                    }
                    foreach ($detail['live'] ?? [] as $row) {
                        abort_unless(
                            is_array($row) && isset($row['k']) && is_string($row['k'])
                                && (! array_key_exists('spec', $row) || is_string($row['spec']))
                                && (! array_key_exists('measured', $row) || is_string($row['measured']))
                                && (! array_key_exists('ok', $row) || is_bool($row['ok'])),
                            422,
                            'dtcDetails live rows need k, optional spec/measured and bool ok.',
                        );
                    }
                }
            }
            foreach ($entry['trainingSessions'] ?? [] as $session) {
                // One session per vehicle: id + title required. Session-level
                // options/correctIndex are an optional fallback — each step may
                // carry its own question + 4 options instead.
                abort_unless(
                    is_array($session)
                        && isset($session['id'], $session['title'])
                        && is_string($session['id']) && $session['id'] !== ''
                        && is_string($session['title']) && $session['title'] !== '',
                    422,
                    'Training sessions need id and title.',
                );
                if (isset($session['options'], $session['correctIndex'])) {
                    abort_unless(
                        is_array($session['options']) && count($session['options']) === 4
                            && collect($session['options'])->every(fn ($o) => is_string($o) && $o !== '')
                            && is_int($session['correctIndex']) && $session['correctIndex'] >= 0 && $session['correctIndex'] <= 3,
                        422,
                        'Session options need exactly 4 entries and correctIndex 0–3.',
                    );
                }
                foreach ($session['steps'] ?? [] as $step) {
                    abort_unless(
                        isset($step['id'], $step['screen'])
                            && is_string($step['id']) && $step['id'] !== ''
                            && in_array($step['screen'], self::TRAINING_SCREENS, true),
                        422,
                        'Training steps need id and a valid lab screen.',
                    );
                    // Per-step question + answers (optional; session-level is fallback).
                    if (array_key_exists('question', $step)) {
                        abort_unless(
                            $step['question'] === null || (is_string($step['question']) && $step['question'] !== ''),
                            422,
                            'Step question must be a non-empty string.',
                        );
                    }
                    if (array_key_exists('options', $step) || array_key_exists('correctIndex', $step)) {
                        abort_unless(
                            isset($step['options'], $step['correctIndex'])
                                && is_array($step['options']) && count($step['options']) === 4
                                && collect($step['options'])->every(fn ($o) => is_string($o) && $o !== '')
                                && is_int($step['correctIndex']) && $step['correctIndex'] >= 0 && $step['correctIndex'] <= 3,
                            422,
                            'Step options need exactly 4 entries and correctIndex 0–3.',
                        );
                    }
                }
            }
            // Multimeter — light validation
            foreach ($entry['procedures'] ?? [] as $proc) {
                abort_unless(is_array($proc) && isset($proc['ref'], $proc['name']) && is_string($proc['ref']) && $proc['ref'] !== '', 422, 'Multimeter procedures need ref and name.');
                foreach ($proc['steps'] ?? [] as $step) {
                    abort_unless(is_array($step) && isset($step['mode'], $step['red'], $step['black']), 422, 'Multimeter steps need mode, red, black.');
                }
            }
            // Oscilloscope — light validation
            foreach ($entry['exercises'] ?? [] as $ex) {
                abort_unless(is_array($ex) && isset($ex['id'], $ex['name']) && is_string($ex['id']) && $ex['id'] !== '', 422, 'Oscilloscope exercises need id and name.');
            }
            // Location — light validation
            foreach ($entry['components'] ?? [] as $comp) {
                // Allow both location components (key/ref) and schematic components (key/code) — validate presence of key
                abort_unless(is_array($comp) && isset($comp['key']) && is_string($comp['key']) && $comp['key'] !== '', 422, 'Location components need key.');
            }
            // Schematic — light validation for wires/traces/tasks
            foreach ($entry['wires'] ?? [] as $wire) {
                abort_unless(is_array($wire) && isset($wire['ecuPin'], $wire['target']), 422, 'Schematic wires need ecuPin and target.');
            }
            foreach ($entry['traces'] ?? [] as $trace) {
                abort_unless(is_array($trace) && isset($trace['id']) && is_string($trace['id']) && $trace['id'] !== '', 422, 'Schematic traces need id.');
            }
        }
    }

    private function serializeVariant(VehicleVariant $variant): array
    {
        return [
            'id' => $variant->id,
            'name' => $variant->name,
            'engine_code' => $variant->engine_code,
            'fuel_type' => $variant->fuel_type,
            'transmission' => $variant->transmission,
            'year_from' => $variant->year_from,
            'year_to' => $variant->year_to,
            'metadata' => $variant->metadata,
            'packs_count' => $variant->dataPacks()->count(),
        ];
    }

    private function serializePack(SimulatorDataPack $pack, bool $withVariant = false): array
    {
        return [
            'id' => $pack->id,
            'vehicle_variant_id' => $pack->vehicle_variant_id,
            'code' => $pack->code,
            'version' => $pack->version,
            'status' => $pack->status,
            'manifest' => $pack->manifest,
            'created_by' => $pack->created_by,
            'updated_at' => $pack->updated_at?->toISOString(),
            'variant' => $withVariant ? [
                'id' => $pack->vehicleVariant?->id,
                'name' => $pack->vehicleVariant?->name,
                'engine_code' => $pack->vehicleVariant?->engine_code,
            ] : null,
        ];
    }
}
