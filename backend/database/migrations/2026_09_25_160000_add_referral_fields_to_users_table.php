<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'referral_code')) {
                $table->string('referral_code', 12)
                    ->nullable()
                    ->unique()
                    ->after('username');
            }

            if (! Schema::hasColumn('users', 'referred_by')) {
                $table->foreignId('referred_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete()
                    ->after('referral_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'referred_by')) {
                $table->dropConstrainedForeignId('referred_by');
            }

            if (Schema::hasColumn('users', 'referral_code')) {
                $table->dropUnique(['referral_code']);
                $table->dropColumn('referral_code');
            }
        });
    }
};
