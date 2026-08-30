<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration { public function up(): void { foreach (['quiz_attempts', 'assessment_attempts'] as $tableName) { Schema::table($tableName, function (Blueprint $table) { $table->unsignedTinyInteger('tab_switch_count')->default(0); $table->timestamp('blocked_at')->nullable(); }); } } public function down(): void { foreach (['quiz_attempts', 'assessment_attempts'] as $tableName) { Schema::table($tableName, fn (Blueprint $table) => $table->dropColumn(['tab_switch_count', 'blocked_at'])); } } };
