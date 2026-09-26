<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->decimal('irt_a', 5, 3)->nullable()->after('type'); // Discrimination parameter
            $table->decimal('irt_b', 5, 3)->nullable()->after('irt_a'); // Difficulty parameter
            $table->decimal('irt_c', 5, 3)->nullable()->after('irt_b'); // Guessing parameter
            $table->boolean('is_calibrated')->default(false)->after('irt_c');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropColumn(['irt_a', 'irt_b', 'irt_c', 'is_calibrated']);
        });
    }
};