<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_privacy_settings', function (Blueprint $table): void {
            $table->boolean('send_read_receipts')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('student_privacy_settings', function (Blueprint $table): void {
            $table->dropColumn('send_read_receipts');
        });
    }
};
