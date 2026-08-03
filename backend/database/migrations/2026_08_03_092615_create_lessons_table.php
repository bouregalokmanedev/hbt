<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('section_id');

            $table->string('title')->nullable();
            $table->string('slug')->nullable();

            $table->text('description')->nullable();
            $table->longText('content')->nullable();

            $table->unsignedInteger('position');

            $table->string('status')->default('draft');

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

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};