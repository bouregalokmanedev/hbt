<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('quizzes', function (Blueprint $table) {
        $table->uuid('id')->primary();

        $table->uuid('section_id');

        $table->string('title');
        $table->string('slug')->nullable();

        $table->text('description')->nullable();

        $table->unsignedInteger('position');

        $table->string('status')->default('draft');

        $table->unsignedTinyInteger('pass_percentage')->default(70);

        $table->unsignedInteger('max_attempts')->nullable();

        $table->unsignedInteger('time_limit')->nullable();

        $table->timestamps();

        $table->foreign('section_id')
            ->references('id')
            ->on('sections')
            ->cascadeOnDelete();

        $table->unique([
            'section_id',
            'position',
        ]);

        $table->unique([
            'section_id',
            'slug',
        ]);

        $table->index([
            'section_id',
            'status',
        ]);
    });
}

    /**
     * Reverse the migrations.
     */
   public function down(): void
{
    Schema::dropIfExists('quizzes');
}
};
