<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table): void {
            if (! Schema::hasColumn('assessments', 'time_limit_minutes')) {
                $table->unsignedInteger('time_limit_minutes')
                    ->nullable()
                    ->after('max_attempts');
            }
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table): void {
            if (Schema::hasColumn('assessments', 'time_limit_minutes')) {
                $table->dropColumn('time_limit_minutes');
            }
        });
    }
};
