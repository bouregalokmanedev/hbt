<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table): void {
            if (! Schema::hasColumn('certificates', 'revoked_at')) {
                $table->timestamp('revoked_at')->nullable()->after('issued_at');
            }
            if (! Schema::hasColumn('certificates', 'revoked_reason')) {
                $table->string('revoked_reason', 255)->nullable()->after('revoked_at');
            }
            if (! Schema::hasColumn('certificates', 'revoked_by')) {
                $table->foreignId('revoked_by')->nullable()->after('revoked_reason')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->unique(['user_id', 'course_id'], 'certificates_user_course_unique');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropUnique('certificates_user_course_unique');
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('revoked_by');
            $table->dropColumn(['revoked_at', 'revoked_reason']);
        });
    }
};
