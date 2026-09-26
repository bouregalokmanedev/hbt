<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_makes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('country')->nullable();
            $table->timestamps();
        });

        Schema::create('vehicle_models', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('make_id')->constrained('vehicle_makes')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->timestamps();
            $table->unique(['make_id', 'slug']);
        });

        Schema::create('vehicle_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('model_id')->constrained('vehicle_models')->cascadeOnDelete();
            $table->string('name');
            $table->string('engine_code')->nullable();
            $table->string('fuel_type')->nullable();
            $table->string('transmission')->nullable();
            $table->unsignedSmallInteger('year_from')->nullable();
            $table->unsignedSmallInteger('year_to')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('simulator_data_packs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_variant_id')->constrained('vehicle_variants')->cascadeOnDelete();
            $table->string('code');
            $table->string('version');
            $table->string('status')->default('draft');
            $table->json('manifest')->nullable();
            $table->timestamps();
            $table->unique(['vehicle_variant_id', 'code', 'version']);
        });

        // Link existing diagnostic scenarios to a data pack (nullable for legacy).
        Schema::table('diagnostic_scenarios', function (Blueprint $table) {
            $table->foreignUuid('data_pack_id')->nullable()->after('course_id')->constrained('simulator_data_packs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('diagnostic_scenarios', function (Blueprint $table) {
            $table->dropConstrainedForeignId('data_pack_id');
        });
        Schema::dropIfExists('simulator_data_packs');
        Schema::dropIfExists('vehicle_variants');
        Schema::dropIfExists('vehicle_models');
        Schema::dropIfExists('vehicle_makes');
    }
};
