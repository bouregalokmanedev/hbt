<?php

use App\Domains\AI\Enums\MentorAIRequestType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentor_ai_usages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->uuid('course_id')
                ->nullable();

            $table->foreignId('conversation_id')
                ->nullable()
                ->constrained(
                    'mentor_conversations'
                )
                ->nullOnDelete();

            $table->string('provider');
            $table->string('model');

            $table->string('request_type');

            $table->unsignedInteger('input_tokens')
                ->default(0);

            $table->unsignedInteger('output_tokens')
                ->default(0);

            $table->unsignedInteger('total_tokens')
                ->default(0);

            $table->unsignedInteger('response_time_ms')
                ->nullable();

            $table->boolean('successful')
                ->default(true);

            $table->string('failure_reason')
                ->nullable();

            $table->timestamps();

            $table->index([
                'user_id',
                'created_at',
            ]);

            $table->index([
                'user_id',
                'request_type',
                'created_at',
            ]);

            $table->index([
                'course_id',
                'created_at',
            ]);

            $table->index([
                'conversation_id',
                'created_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_ai_usages');
    }
};