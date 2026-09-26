<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulator_components', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('data_pack_id')->constrained('simulator_data_packs')->cascadeOnDelete();
            $table->string('ref_code', 32); // R16, E1, INJ1
            $table->string('name_key')->nullable();
            $table->string('category', 32)->nullable(); // sensor, ecu, relay...
            $table->string('kind', 32)->nullable();
            $table->string('oem_reference')->nullable();
            $table->string('system_code')->nullable();
            $table->string('zone_code')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['data_pack_id', 'ref_code']);
            $table->index(['data_pack_id', 'category']);
        });

        Schema::create('simulator_connectors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('data_pack_id')->constrained('simulator_data_packs')->cascadeOnDelete();
            $table->foreignUuid('component_id')->constrained('simulator_components')->cascadeOnDelete();
            $table->string('code', 32);
            $table->string('name')->nullable();
            $table->unsignedSmallInteger('pin_count')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['component_id', 'code']);
        });

        Schema::create('simulator_pins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('component_id')->constrained('simulator_components')->cascadeOnDelete();
            $table->string('connector_code', 32)->nullable();
            $table->string('pin_number', 16);
            $table->string('pin_name_key')->nullable();
            $table->string('electrical_type', 32)->nullable();
            $table->string('wire_color', 32)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['component_id', 'connector_code', 'pin_number'], 'sim_pins_comp_conn_pin_unique');
            $table->index(['component_id', 'pin_number']);
        });

        Schema::create('simulator_nets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('data_pack_id')->constrained('simulator_data_packs')->cascadeOnDelete();
            $table->string('code', 64);
            $table->string('name_key')->nullable();
            $table->string('type', 32)->nullable(); // power/ground/signal/can/lin
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['data_pack_id', 'code']);
        });

        Schema::create('simulator_net_members', function (Blueprint $table) {
            $table->foreignUuid('net_id')->constrained('simulator_nets')->cascadeOnDelete();
            $table->foreignUuid('component_id')->constrained('simulator_components')->cascadeOnDelete();
            $table->foreignUuid('pin_id')->constrained('simulator_pins')->cascadeOnDelete();
            $table->primary(['net_id', 'pin_id']);
        });

        Schema::create('simulator_wires', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('data_pack_id')->constrained('simulator_data_packs')->cascadeOnDelete();
            $table->foreignUuid('from_component_id')->constrained('simulator_components')->cascadeOnDelete();
            $table->foreignUuid('from_pin_id')->constrained('simulator_pins')->cascadeOnDelete();
            $table->foreignUuid('to_component_id')->constrained('simulator_components')->cascadeOnDelete();
            $table->foreignUuid('to_pin_id')->constrained('simulator_pins')->cascadeOnDelete();
            $table->string('wire_color', 32)->nullable();
            $table->string('circuit_type', 32)->nullable();
            $table->decimal('resistance_ohm', 8, 3)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['data_pack_id', 'from_component_id']);
            $table->index(['data_pack_id', 'to_component_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulator_wires');
        Schema::dropIfExists('simulator_net_members');
        Schema::dropIfExists('simulator_nets');
        Schema::dropIfExists('simulator_pins');
        Schema::dropIfExists('simulator_connectors');
        Schema::dropIfExists('simulator_components');
    }
};
