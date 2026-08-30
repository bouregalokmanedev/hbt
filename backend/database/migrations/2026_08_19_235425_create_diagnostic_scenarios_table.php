<?php

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_scenarios', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->string('title');
            $table->string('slug');

            $table->text('description')->nullable();

            $table->unsignedInteger('position')
                ->default(1);

            $table->unsignedTinyInteger('passing_score')
                ->default(70);

            $table->unsignedInteger('time_limit')
                ->nullable();

            $table->string('status')
                ->default(DiagnosticScenarioStatus::DRAFT->value);

            $table->boolean('is_required')
                ->default(false);

            $table->timestamp('published_at')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'course_id',
                'slug',
            ]);

            $table->unique([
                'course_id',
                'position',
            ]);

            $table->index([
                'course_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_scenarios');
    }
};