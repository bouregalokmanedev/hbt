<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('analytics_events', function (Blueprint $table): void {
            // Primary sub-tag of Accept-Language (en, ar, fr) captured server-side.
            $table->string('language', 16)->nullable()->after('referrer');
            $table->index(['language', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('analytics_events', function (Blueprint $table): void {
            $table->dropIndex(['language', 'created_at']);
            $table->dropColumn('language');
        });
    }
};
