<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_sessions', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
             * Sanctum token
             */

            $table->foreignId('token_id')
                ->nullable()
                ->constrained('personal_access_tokens')
                ->nullOnDelete();

            /*
             * Device
             */

            $table->string('device_name')->nullable();

            $table->string('browser')->nullable();

            $table->string('platform')->nullable();

            $table->string('device_type')->nullable();

            /*
             * Network
             */

            $table->ipAddress('ip_address');

            $table->text('user_agent');

            /*
             * Activity
             */

            $table->timestamp('last_activity_at');

            $table->timestamp('logged_in_at');

            $table->timestamp('logged_out_at')->nullable();

            $table->boolean('is_current')->default(false);

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};