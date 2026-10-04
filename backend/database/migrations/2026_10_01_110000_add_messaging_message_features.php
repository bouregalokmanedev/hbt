<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->timestamp('edited_at')->nullable()->after('reply_to_id');
        });

        Schema::table('message_participants', function (Blueprint $table): void {
            $table->timestamp('muted_at')->nullable()->after('last_read_at');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropColumn('edited_at');
        });

        Schema::table('message_participants', function (Blueprint $table): void {
            $table->dropColumn('muted_at');
        });
    }
};
