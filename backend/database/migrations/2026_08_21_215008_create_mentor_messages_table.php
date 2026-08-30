<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentor_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('mentor_conversation_id')
                ->constrained('mentor_conversations')
                ->cascadeOnDelete();

            $table->string('role');

            $table->text('content');

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index([
                'mentor_conversation_id',
                'role',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_messages');
    }
};