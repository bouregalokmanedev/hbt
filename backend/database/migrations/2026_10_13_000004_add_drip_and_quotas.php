<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->unsignedTinyInteger('drip_level')->default(0)->after('lost_reason');
        });

        Schema::create('sales_quotas', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users', 'uuid')->cascadeOnDelete();
            $table->string('year_month', 7);
            $table->unsignedInteger('target')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'year_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_quotas');
        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->dropColumn('drip_level');
        });
    }
};
