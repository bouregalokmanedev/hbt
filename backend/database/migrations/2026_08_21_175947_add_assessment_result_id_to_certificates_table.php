<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table): void {
            $table->uuid('assessment_result_id')
                ->unique()
                ->after('enrollment_id');

            $table->foreign('assessment_result_id')
                ->references('id')
                ->on('assessment_results')
                ->cascadeOnDelete();
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropUnique('certificates_enrollment_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropForeign([
                'assessment_result_id',
            ]);

            $table->dropUnique([
                'assessment_result_id',
            ]);

            $table->dropColumn('assessment_result_id');

            $table->unique('enrollment_id');
        });
    }
};