<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('enrollment_id')->unique();
            $table->foreignUuid('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('certificate_number', 32)->unique();
            $table->string('recipient_name');
            $table->string('course_title');
            $table->timestamp('issued_at');
            $table->timestamps();
            $table->foreign('enrollment_id')->references('id')->on('enrollments')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
