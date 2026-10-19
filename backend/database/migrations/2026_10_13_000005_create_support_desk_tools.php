<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-agent canned reply templates ("macros") for the ticket + mailbox reply boxes.
        // user_id is a bigint FK to users.id, matching every other support_* table.
        Schema::create('canned_replies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index('user_id');
        });

        // Free-form tags agents can stick on a ticket beyond the fixed category enum.
        Schema::table('support_tickets', function (Blueprint $table): void {
            $table->json('tags')->nullable()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table): void {
            $table->dropColumn('tags');
        });

        Schema::dropIfExists('canned_replies');
    }
};
