<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->foreignId('uploaded_by')
        ->constrained('users')
        ->cascadeOnDelete();

    $table->string('disk');
    $table->string('path');

    $table->string('original_name');
    $table->string('filename');

    $table->string('mime_type');
    $table->string('extension')->nullable();
    $table->unsignedBigInteger('size');

    $table->string('type');

    // IMPORTANT: Lesson uses UUID
    $table->nullableUuidMorphs('mediable');

    $table->json('metadata')->nullable();

    $table->timestamps();

    $table->index([
        'uploaded_by',
        'type',
    ]);

    $table->index([
        'disk',
        'path',
    ]);
});
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};