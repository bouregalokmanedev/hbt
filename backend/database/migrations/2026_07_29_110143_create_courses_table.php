<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {

            $table->uuid('id')->primary();

            /*
             * Ownership
             */

            $table->foreignId('instructor_id')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
             * Information
             */

$table->string('title');
$table->string('slug')->unique();
$table->string('short_description', 500);
$table->longText('description');

            /*
             * Learning
             */

            $table->string('language')->default('en');

            $table->string('difficulty')
                ->default(Difficulty::BEGINNER->value);

            $table->integer('duration_minutes')
                ->default(0);

            /*
             * Commerce
             */

            $table->unsignedInteger('price')
                ->default(0);

            $table->unsignedInteger('discount_price')
                ->nullable();

            $table->string('currency',3)
                ->default('USD');

            $table->boolean('is_free')
                ->default(true);

            /*
             * Publishing
             */

            $table->string('status')
                ->default(CourseStatus::DRAFT->value);

            $table->string('visibility')
                ->default(Visibility::PRIVATE->value);

            $table->timestamp('published_at')
                ->nullable();

            /*
             * Media
             */

            $table->string('thumbnail')
                ->nullable();

            $table->string('cover_image')
                ->nullable();

            $table->string('preview_video')
                ->nullable();

            /*
             * SEO
             */

            $table->string('meta_title')
                ->nullable();

            $table->text('meta_description')
                ->nullable();

            /*
             * Extra
             */

            $table->json('metadata')
                ->nullable();

            $table->softDeletes();

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};