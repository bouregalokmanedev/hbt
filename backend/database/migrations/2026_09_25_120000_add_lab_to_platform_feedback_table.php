<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_feedback', function (Blueprint $table) {
            $table->string('lab', 50)->nullable()->after('area');

            $table->index(['lab', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::table('platform_feedback', function (Blueprint $table) {
            $table->dropIndex(['lab', 'rating']);
            $table->dropColumn('lab');
        });
    }
};
