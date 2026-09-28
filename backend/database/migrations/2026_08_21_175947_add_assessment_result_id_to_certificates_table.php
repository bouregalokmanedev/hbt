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
            // MySQL cannot drop an index that backs a foreign key, so detach
            // the enrollment FK before removing its unique index, then restore it.
            $table->dropForeign(['enrollment_id']);
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropUnique('certificates_enrollment_id_unique');
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->foreign('enrollment_id')
                ->references('id')
                ->on('enrollments')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropForeign(['enrollment_id']);
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropForeign([
                'assessment_result_id',
            ]);

            $table->dropUnique([
                'assessment_result_id',
            ]);

            $table->dropColumn('assessment_result_id');
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->unique('enrollment_id');

            $table->foreign('enrollment_id')
                ->references('id')
                ->on('enrollments')
                ->cascadeOnDelete();
        });
    }
};