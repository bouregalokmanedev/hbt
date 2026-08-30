<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentor_conversations', function (Blueprint $table): void {
            $table->foreignUuid('lesson_id')
                ->nullable()
                ->after('course_id')
                ->constrained('lessons')
                ->nullOnDelete();

            $table->timestamp('last_message_at')
                ->nullable()
                ->after('status');

            $table->index(['course_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::table('mentor_conversations', function (Blueprint $table): void {
            $table->dropIndex(['course_id', 'lesson_id']);
            $table->dropConstrainedForeignId('lesson_id');
            $table->dropColumn('last_message_at');
        });
    }
};
