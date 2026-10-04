<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_mails', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('thread_id')->nullable();
            $table->string('direction', 10);
            $table->string('subject', 255);
            $table->text('body');
            $table->string('from_name', 150);
            $table->string('from_email', 255);
            $table->string('to_name', 150)->nullable();
            $table->string('to_email', 255);
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('recipient_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('contact_message_id')->nullable()->unique()->constrained('contact_messages')->nullOnDelete();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index('thread_id');
            $table->index(['direction', 'archived_at']);
            $table->index('created_at');
        });

        // Existing contact-form submissions become the first inbound threads so
        // the mailbox opens with history instead of an empty inbox.
        $supportMailbox = (string) config('mail.contact_to', 'support@hbtronics.dz');

        DB::table('contact_messages')->orderBy('id')->chunkById(200, function ($contacts) use ($supportMailbox): void {
            foreach ($contacts as $contact) {
                DB::table('support_mails')->insert([
                    'id' => (string) Str::uuid(),
                    'thread_id' => null,
                    'direction' => 'inbound',
                    'subject' => $contact->subject,
                    'body' => $contact->message,
                    'from_name' => trim($contact->first_name.' '.($contact->last_name ?? '')),
                    'from_email' => $contact->email,
                    'to_name' => null,
                    'to_email' => $supportMailbox,
                    'sender_user_id' => null,
                    'recipient_user_id' => null,
                    'contact_message_id' => $contact->id,
                    'read_at' => $contact->read_at,
                    'archived_at' => null,
                    'created_at' => $contact->created_at,
                    'updated_at' => $contact->updated_at,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_mails');
    }
};
