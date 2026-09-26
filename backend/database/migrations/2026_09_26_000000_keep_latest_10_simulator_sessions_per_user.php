<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * One-time cleanup of simulator_sessions: keep only the 10 most recent
     * sessions per user and delete everything else (a load/test loop had left
     * millions of junk rows). simulator_results cascade on delete.
     */
    public function up(): void
    {
        DB::statement(<<<'SQL'
            DELETE FROM simulator_sessions
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY user_id
                               ORDER BY created_at DESC, id DESC
                           ) AS rank
                    FROM simulator_sessions
                ) ranked
                WHERE ranked.rank <= 10
            )
        SQL);
    }

    /**
     * Removed sessions cannot be restored.
     */
    public function down(): void
    {
        //
    }
};
