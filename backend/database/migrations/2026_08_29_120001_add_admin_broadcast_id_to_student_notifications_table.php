<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_notifications', function (Blueprint $table) {
            $table->uuid('admin_broadcast_id')->nullable()->after('user_id');
            $table->foreign('admin_broadcast_id')
                ->references('id')
                ->on('admin_broadcasts')
                ->nullOnDelete();
            $table->index('admin_broadcast_id');
        });
    }

    public function down(): void
    {
        Schema::table('student_notifications', function (Blueprint $table) {
            $table->dropForeign(['admin_broadcast_id']);
            $table->dropIndex(['admin_broadcast_id']);
            $table->dropColumn('admin_broadcast_id');
        });
    }
};
