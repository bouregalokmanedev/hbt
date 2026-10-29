<?php

use App\Enums\Bootcamps\BootcampDurationUnit;
use App\Enums\Bootcamps\BootcampStatus;
use App\Enums\Courses\Difficulty;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bootcamps', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('instructor_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('title');
            $table->string('slug')->unique();
            $table->string('short_description', 500)->nullable();
            $table->longText('description');

            $table->unsignedInteger('duration_value')->default(1);
            $table->string('duration_unit')
                ->default(BootcampDurationUnit::WEEKS->value);

            $table->string('location');

            $table->decimal('price', 10, 2)->default(0);
            $table->char('currency', 3)->default('DZD');

            $table->string('level')
                ->default(Difficulty::BEGINNER->value);

            // Toggles authored by the instructor: challenges, resources,
            // quizzes, support and certificate.
            $table->json('includes')->nullable();

            $table->string('status')
                ->default(BootcampStatus::DRAFT->value);

            $table->string('brochure_path')->nullable();
            $table->string('brochure_original_name')->nullable();

            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
            $table->index(['instructor_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bootcamps');
    }
};
