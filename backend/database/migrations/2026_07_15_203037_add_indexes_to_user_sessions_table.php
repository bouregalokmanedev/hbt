<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_sessions', function (Blueprint $table) {

    $table->index('user_id');

    $table->index('token_id');

    $table->index('last_activity_at');

    $table->index('logged_in_at');

    $table->index(['user_id', 'last_activity_at']);

});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_sessions', function (Blueprint $table) {
            //
        });
    }
};
