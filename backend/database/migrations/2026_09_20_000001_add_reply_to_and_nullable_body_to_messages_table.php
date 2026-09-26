<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->foreignUuid('reply_to_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->text('body')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropForeign(['reply_to_id']);
            $table->dropColumn('reply_to_id');
            $table->text('body')->nullable(false)->change();
        });
    }
};
