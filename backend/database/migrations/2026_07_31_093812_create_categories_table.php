<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->uuid('parent_id')->nullable();

            $table->string('name',150);

            $table->string('slug',180)->unique();

            $table->text('description')->nullable();

            $table->string('icon')->nullable();

            $table->string('color',20)->nullable();

            $table->unsignedInteger('sort_order')->default(0);

            $table->boolean('is_active')->default(true);

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->softDeletes();

            $table->foreign('parent_id')
                ->references('id')
                ->on('categories')
                ->nullOnDelete();

        });

    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};