<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bootcamp_lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('bootcamp_section_id');
            $table->string('title');
            $table->unsignedInteger('classroom_count')->default(0);
            $table->unsignedInteger('duration_minutes')->default(0);
            $table->unsignedInteger('position')->default(0);

            $table->timestamps();

            $table->foreign('bootcamp_section_id')
                ->references('id')
                ->on('bootcamp_sections')
                ->cascadeOnDelete();

            $table->index(['bootcamp_section_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bootcamp_lessons');
    }
};
