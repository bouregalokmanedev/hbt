<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->string('status', 20)->default('new')->after('converted_at')->index();
            $table->foreignUuid('owner_id')->nullable()->after('status')
                ->constrained('users', 'uuid')->nullOnDelete();
            $table->unsignedTinyInteger('score')->default(0)->after('owner_id')->index();
            $table->string('source', 50)->nullable()->after('score')->index();
            $table->string('utm_source', 100)->nullable()->after('source');
            $table->string('utm_medium', 100)->nullable()->after('utm_source');
            $table->string('utm_campaign', 100)->nullable()->after('utm_medium');
            $table->string('utm_term', 100)->nullable()->after('utm_campaign');
            $table->string('utm_content', 100)->nullable()->after('utm_term');
            $table->string('course_interest', 255)->nullable()->after('utm_content');
            $table->timestamp('next_follow_up_at')->nullable()->after('course_interest')->index();
            $table->timestamp('closed_at')->nullable()->after('next_follow_up_at');
            $table->string('lost_reason', 100)->nullable()->after('closed_at');
            $table->index(['status', 'owner_id']);
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('owner_id');
            $table->dropIndex(['status', 'owner_id']);
            $table->dropColumn([
                'status', 'score', 'source',
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'course_interest', 'next_follow_up_at', 'closed_at', 'lost_reason',
            ]);
        });
    }
};
