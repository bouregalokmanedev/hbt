<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_broadcasts', function (Blueprint $table): void {
            $table->boolean('replies_enabled')->default(true)->after('action_url');
            $table->json('quick_replies')->nullable()->after('replies_enabled');
        });

        Schema::table('student_notifications', function (Blueprint $table): void {
            $table->uuid('message_conversation_id')->nullable()->after('admin_broadcast_id');
            $table->foreign('message_conversation_id')->references('id')->on('message_conversations')->nullOnDelete();
            $table->index('message_conversation_id');
        });
    }

    public function down(): void
    {
        Schema::table('student_notifications', function (Blueprint $table): void {
            $table->dropForeign(['message_conversation_id']);
            $table->dropIndex(['message_conversation_id']);
            $table->dropColumn('message_conversation_id');
        });
        Schema::table('admin_broadcasts', function (Blueprint $table): void {
            $table->dropColumn(['replies_enabled', 'quick_replies']);
        });
    }
};
