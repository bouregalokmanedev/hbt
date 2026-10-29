<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bootcamp_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('bootcamp_id');
            $table->date('starts_at');
            $table->date('ends_at');

            $table->timestamps();

            $table->foreign('bootcamp_id')
                ->references('id')
                ->on('bootcamps')
                ->cascadeOnDelete();

            $table->index(['bootcamp_id', 'starts_at']);
            $table->index('ends_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bootcamp_schedules');
    }
};
