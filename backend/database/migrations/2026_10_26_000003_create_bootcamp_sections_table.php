<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bootcamp_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('bootcamp_id');
            $table->string('title');
            $table->unsignedInteger('position')->default(0);

            $table->timestamps();

            $table->foreign('bootcamp_id')
                ->references('id')
                ->on('bootcamps')
                ->cascadeOnDelete();

            $table->index(['bootcamp_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bootcamp_sections');
    }
};
