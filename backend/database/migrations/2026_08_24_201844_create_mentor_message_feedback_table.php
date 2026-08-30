<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentor_message_feedback', function (Blueprint $table) {
            $table->id();

            $table->foreignId('mentor_message_id')
                ->constrained('mentor_messages')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('rating');

            $table->string('reason')->nullable();

            $table->text('comment')->nullable();

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->unique([
                'mentor_message_id',
                'user_id',
            ]);

            $table->index([
                'user_id',
                'rating',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_message_feedback');
    }
};