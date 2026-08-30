<?php

use App\Domains\AI\Enums\MentorMemoryType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentor_memories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->uuid('course_id')
                ->nullable();

            $table->string('type', 50);

            $table->string('key', 150);

            $table->text('value');

            $table->decimal('confidence', 5, 4)
                ->default(1.0000);

            $table->string('source', 100)
                ->nullable();

            $table->timestamp('last_used_at')
                ->nullable();

            $table->timestamp('expires_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'user_id',
                'type',
            ]);

            $table->index([
                'user_id',
                'course_id',
            ]);

            $table->index([
                'user_id',
                'key',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_memories');
    }
};