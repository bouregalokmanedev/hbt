<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_conversations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->uuid('admin_broadcast_id')->nullable();
            $table->string('type', 30)->default('direct');
            $table->string('subject')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            $table->foreign('admin_broadcast_id')->references('id')->on('admin_broadcasts')->nullOnDelete();
            $table->index(['created_by', 'status']);
            $table->index(['admin_broadcast_id']);
        });

        Schema::create('message_participants', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('conversation_id')->constrained('message_conversations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();
            $table->unique(['conversation_id', 'user_id']);
            $table->index(['user_id', 'last_read_at']);
        });

        Schema::create('messages', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('message_conversations')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->string('message_type', 30)->default('text');
            $table->text('body');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('message_participants');
        Schema::dropIfExists('message_conversations');
    }
};
