<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->nullable()->after('closed_at');
            $table->string('rating_comment', 500)->nullable()->after('rating');
            $table->timestamp('rated_at')->nullable()->after('rating_comment');

            $table->index(['rating']);
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropIndex(['rating']);
            $table->dropColumn(['rating', 'rating_comment', 'rated_at']);
        });
    }
};
