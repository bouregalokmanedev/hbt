<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Consolidate the old training-site labels onto the three campuses now
     * offered by the registration form and instructor editor.
     */
    public function up(): void
    {
        DB::table('bootcamps')
            ->whereIn('location', [
                'Algiers · Hydra Campus',
                'Algiers · Centre Campus',
            ])
            ->update(['location' => 'Algiers Campus']);

        DB::table('bootcamps')
            ->where('location', 'Oran')
            ->update(['location' => 'EL-Oued Campus']);
    }

    public function down(): void
    {
        // The original per-site labels cannot be reconstructed reliably.
    }
};
