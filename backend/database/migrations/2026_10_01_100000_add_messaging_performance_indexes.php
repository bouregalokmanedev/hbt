<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The inbox sorts by `last_message_at`, the staff room looks up by `type` and
 * the daily send cap counts by `sender_id` — none of which were indexed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_conversations', function (Blueprint $table): void {
            $table->index(['last_message_at']);
            $table->index(['type']);
        });

        Schema::table('messages', function (Blueprint $table): void {
            $table->index(['sender_id']);
        });
    }

    public function down(): void
    {
        Schema::table('message_conversations', function (Blueprint $table): void {
            $table->dropIndex(['last_message_at']);
            $table->dropIndex(['type']);
        });

        Schema::table('messages', function (Blueprint $table): void {
            $table->dropIndex(['sender_id']);
        });
    }
};
