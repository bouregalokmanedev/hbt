<?php

use App\Enums\Bootcamps\BootcampRegistrationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bootcamp_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('bootcamp_id');
            $table->uuid('bootcamp_schedule_id');

            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone', 40);

            $table->string('site');
            $table->string('payment_method');
            $table->boolean('terms_accepted')->default(false);

            $table->string('status')
                ->default(BootcampRegistrationStatus::PENDING->value);

            $table->timestamps();

            $table->foreign('bootcamp_id')
                ->references('id')
                ->on('bootcamps')
                ->cascadeOnDelete();

            $table->foreign('bootcamp_schedule_id')
                ->references('id')
                ->on('bootcamp_schedules')
                ->cascadeOnDelete();

            $table->unique(
                ['bootcamp_id', 'bootcamp_schedule_id', 'email'],
                'bootcamp_registrations_session_email_unique'
            );

            $table->index(['bootcamp_id', 'status']);
            $table->index(['email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bootcamp_registrations');
    }
};
