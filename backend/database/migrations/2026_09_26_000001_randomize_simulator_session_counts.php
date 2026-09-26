<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Follow-up cleanup: instead of a flat 10 rows per user, keep a small
     * random-looking mix per user (targets cycle 1, 2, 3, 4 across the
     * learners) so the table reads like organic history again.
     * simulator_results cascade on delete.
     */
    public function up(): void
    {
        $userIds = DB::table('simulator_sessions')
            ->distinct()
            ->pluck('user_id')
            ->all();

        shuffle($userIds);

        $targets = [1, 2, 3, 4];

        foreach ($userIds as $index => $userId) {
            $ids = DB::table('simulator_sessions')
                ->where('user_id', $userId)
                ->pluck('id')
                ->all();

            shuffle($ids);

            $keep = min(count($ids), $targets[$index % count($targets)]);
            $drop = array_slice($ids, $keep);

            foreach (array_chunk($drop, 1000) as $chunk) {
                DB::table('simulator_sessions')->whereIn('id', $chunk)->delete();
            }
        }
    }

    /**
     * Removed sessions cannot be restored.
     */
    public function down(): void
    {
        //
    }
};
