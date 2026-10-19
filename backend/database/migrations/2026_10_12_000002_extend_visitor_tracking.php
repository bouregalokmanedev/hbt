<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('analytics_events', function (Blueprint $table): void {
            $table->uuid('visitor_id')->nullable()->after('user_id')->index();
            $table->string('country', 2)->nullable()->after('session_hash');
            $table->string('region', 80)->nullable()->after('country');
            $table->string('city', 80)->nullable()->after('region');
            $table->string('user_agent', 512)->nullable()->after('city');
            $table->string('referrer', 512)->nullable()->after('user_agent');
            $table->index(['visitor_id', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'visitor_id')) {
                $table->uuid('visitor_id')->nullable()->after('remember_token')->index();
            }
        });

        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->uuid('visitor_id')->nullable()->after('user_agent')->index();
            $table->timestamp('converted_at')->nullable()->after('read_at');
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->dropColumn(['visitor_id', 'converted_at']);
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['visitor_id']);
        });
        Schema::table('analytics_events', function (Blueprint $table): void {
            $table->dropColumn(['visitor_id', 'country', 'region', 'city', 'user_agent', 'referrer']);
        });
    }
};
