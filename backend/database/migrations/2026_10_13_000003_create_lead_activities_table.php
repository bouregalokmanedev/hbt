<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_activities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('contact_message_id')->constrained('contact_messages')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users', 'uuid')->nullOnDelete();
            $table->string('type', 30);
            $table->text('body')->nullable();
            $table->timestamps();

            $table->index(['contact_message_id', 'created_at']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_activities');
    }
};
