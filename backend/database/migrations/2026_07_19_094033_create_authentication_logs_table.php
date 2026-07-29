<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('authentication_logs', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            /*
             * Authentication Event
             */

            $table->string('event');

            /*
             * Status
             */

            $table->boolean('successful');

            /*
             * Identity
             */

            $table->string('email')->nullable();

            /*
             * Network
             */

            $table->ipAddress('ip_address');

            $table->text('user_agent');

            /*
             * Device
             */

            $table->string('browser')->nullable();

            $table->string('platform')->nullable();

            $table->string('device_type')->nullable();

            /*
             * Reason
             */

            $table->string('failure_reason')->nullable();

            /*
             * Metadata
             */

            $table->json('metadata')->nullable();

            $table->timestamps();

        });

    }

    public function down(): void
    {
        Schema::dropIfExists('authentication_logs');
    }
};