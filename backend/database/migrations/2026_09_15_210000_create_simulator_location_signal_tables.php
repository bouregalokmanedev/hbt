<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulator_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('data_pack_id')->constrained('simulator_data_packs')->cascadeOnDelete();
            $table->foreignUuid('component_id')->constrained('simulator_components')->cascadeOnDelete();
            $table->string('view_code', 32)->nullable();
            $table->string('zone_code', 32)->nullable();
            $table->string('description_key')->nullable();
            $table->string('mounting_description_key')->nullable();
            $table->decimal('x', 6, 2)->nullable();
            $table->decimal('y', 6, 2)->nullable();
            $table->decimal('width', 6, 2)->nullable();
            $table->decimal('height', 6, 2)->nullable();
            $table->string('image_path')->nullable();
            $table->json('hotspot')->nullable();
            $table->json('related_components')->nullable();
            $table->timestamps();
            $table->index(['data_pack_id', 'view_code']);
        });

        Schema::create('simulator_signal_definitions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('data_pack_id')->constrained('simulator_data_packs')->cascadeOnDelete();
            $table->foreignUuid('component_id')->constrained('simulator_components')->cascadeOnDelete();
            $table->string('channel', 16)->nullable();
            $table->string('unit', 16)->nullable();
            $table->decimal('period_ms', 8, 3)->nullable();
            $table->decimal('supply_v', 6, 2)->nullable();
            $table->decimal('peak_v', 8, 2)->nullable();
            $table->decimal('trigger_level', 8, 2)->nullable();
            $table->string('trigger_edge', 16)->nullable();
            $table->json('reference')->nullable();
            $table->string('generator_code', 64)->nullable();
            $table->json('generator_parameters')->nullable();
            $table->timestamps();
            $table->index(['data_pack_id', 'component_id']);
        });

        Schema::create('simulator_faults', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('data_pack_id')->constrained('simulator_data_packs')->cascadeOnDelete();
            $table->string('code', 64);
            $table->string('name_key')->nullable();
            $table->string('description_key')->nullable();
            $table->string('severity', 16)->nullable();
            $table->string('category', 32)->nullable();
            $table->json('parameters')->nullable();
            $table->timestamps();
            $table->unique(['data_pack_id', 'code']);
        });

        Schema::create('simulator_scenario_faults', function (Blueprint $table) {
            $table->foreignUuid('scenario_id')->constrained('diagnostic_scenarios')->cascadeOnDelete();
            $table->foreignUuid('fault_id')->constrained('simulator_faults')->cascadeOnDelete();
            $table->boolean('is_default')->default(false);
            $table->decimal('weight', 4, 2)->nullable();
            $table->json('injection')->nullable();
            $table->primary(['scenario_id', 'fault_id']);
        });

        Schema::create('simulator_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('scenario_id')->constrained('diagnostic_scenarios')->cascadeOnDelete();
            $table->string('code', 64);
            $table->unsignedInteger('position');
            $table->string('tool', 32)->nullable();
            $table->string('type', 32)->nullable(); // identify_component, measure_voltage...
            $table->string('prompt_key')->nullable();
            $table->string('hint_key')->nullable();
            $table->string('explanation_key')->nullable();
            $table->json('config')->nullable();
            $table->unsignedInteger('points')->default(10);
            $table->boolean('required')->default(true);
            $table->timestamps();
            $table->unique(['scenario_id', 'code']);
            $table->index(['scenario_id', 'position']);
        });

        Schema::create('simulator_rubrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('scenario_id')->constrained('diagnostic_scenarios')->cascadeOnDelete()->unique();
            $table->json('score_config')->nullable();
            $table->json('pass_rules')->nullable();
            $table->json('penalties')->nullable();
            $table->decimal('time_weight', 4, 2)->nullable();
            $table->decimal('accuracy_weight', 4, 2)->nullable();
            $table->decimal('diagnosis_weight', 4, 2)->nullable();
            $table->decimal('procedure_weight', 4, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulator_rubrics');
        Schema::dropIfExists('simulator_tasks');
        Schema::dropIfExists('simulator_scenario_faults');
        Schema::dropIfExists('simulator_faults');
        Schema::dropIfExists('simulator_signal_definitions');
        Schema::dropIfExists('simulator_locations');
    }
};
