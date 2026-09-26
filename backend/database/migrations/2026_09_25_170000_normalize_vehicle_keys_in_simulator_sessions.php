<?php

use App\Domains\Simulator\Support\VehicleKey;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The scanner lab sent its garage card key verbatim, so sessions were stored
 * as `backend:<variant uuid>` while the catalog keys are bare uuids. That made
 * every vehicle appear twice in the instructor breakdown (a prefixed row with
 * sessions and an unlabelled 0-session duplicate) and broke the label lookup.
 * Canonicalising the stored value keeps one row per real vehicle.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('simulator_sessions')
            ->whereNotNull('vehicle_key')
            ->where('vehicle_key', 'like', 'backend:%')
            ->orderBy('id')
            ->chunkById(200, function ($rows): void {
                foreach ($rows as $row) {
                    DB::table('simulator_sessions')
                        ->where('id', $row->id)
                        ->update(['vehicle_key' => VehicleKey::forStorage($row->vehicle_key)]);
                }
            });
    }

    public function down(): void
    {
        // Irreversible by design — the prefixed and canonical forms are now identical.
    }
};
