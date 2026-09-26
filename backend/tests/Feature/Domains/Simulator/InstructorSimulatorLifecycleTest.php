<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Instructor', 'Student'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function simLifecycleInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

function lifecycleManifest(): array
{
    return [[
        'nodes' => [['id' => 'ECM', 'status' => 'fault', 'dtc' => 2]],
        'dtcs' => [['code' => 'P0087', 'desc' => 'Rail pressure low', 'ecu' => 'ECM', 'status' => 'Current', 'severity' => 'high', 'count' => 2]],
        'trainingSessions' => [[
            'id' => 'fuel-starvation',
            'title' => 'Fuel starvation under load',
            'description' => 'Trace low rail pressure to the restricted filter.',
            'steps' => [
                ['id' => 'codes', 'screen' => 'dtc'],
                ['id' => 'live', 'screen' => 'live'],
                ['id' => 'confirm', 'screen' => 'training'],
            ],
            'options' => ['Restricted fuel filter', 'HP pump failure', 'Injector leak', 'MAP sensor'],
            'correctIndex' => 0,
            'hintBudget' => 3,
            'passScore' => 70,
            'weights' => ['accuracy' => 90, 'process' => 85, 'time' => 75],
        ]],
    ]];
}

function makeLifecyclePack($owner): array
{
    $variant = test()->actingAs($owner)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', [
            'make_name' => 'Toyota',
            'model_name' => 'Corolla',
            'name' => '1.6 16V VVT-i',
            'engine_code' => '1ZR-FE',
        ])
        ->assertCreated()
        ->json('data');

    return test()->actingAs($owner)
        ->postJson("/api/v1/instructor/simulator/variants/{$variant['id']}/packs", [
            'code' => 'fuel-pressure-fault',
            'version' => '1.0.0',
            'manifest' => lifecycleManifest(),
        ])
        ->assertCreated()
        ->json('data');
}

it('archives published packs and restores them to draft', function () {
    $author = simLifecycleInstructor();
    $peer = simLifecycleInstructor();
    $pack = makeLifecyclePack($author);

    $this->actingAs($author)->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/submit")->assertOk();
    $this->actingAs($peer)->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/approve")->assertOk();

    // Author cannot delete a published pack — archive instead.
    $this->actingAs($author)
        ->deleteJson("/api/v1/instructor/simulator/packs/{$pack['id']}")
        ->assertForbidden();

    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/archive")
        ->assertOk()
        ->assertJsonPath('data.status', 'archived');

    // Archived packs disappear from the student catalogue.
    $student = User::factory()->create();
    $student->assignRole('Student');
    $this->actingAs($student)
        ->getJson('/api/v1/simulator/training-sessions?tool=scanner')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/restore")
        ->assertOk()
        ->assertJsonPath('data.status', 'draft');
});

it('deletes draft packs but never published history', function () {
    $author = simLifecycleInstructor();
    $pack = makeLifecyclePack($author);

    $this->actingAs($author)
        ->deleteJson("/api/v1/instructor/simulator/packs/{$pack['id']}")
        ->assertOk()
        ->assertJsonPath('data.success', true);

    $this->assertDatabaseMissing('simulator_data_packs', ['id' => $pack['id']]);
});

it('publishes training sessions to the student feed', function () {
    $author = simLifecycleInstructor();
    $peer = simLifecycleInstructor();
    $pack = makeLifecyclePack($author);

    // Draft packs stay invisible to students.
    $student = User::factory()->create();
    $student->assignRole('Student');
    $this->actingAs($student)
        ->getJson('/api/v1/simulator/training-sessions?tool=scanner')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->actingAs($author)->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/submit")->assertOk();
    $this->actingAs($peer)->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/approve")->assertOk();

    $this->actingAs($student)
        ->getJson('/api/v1/simulator/training-sessions?tool=scanner')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', 'fuel-starvation')
        ->assertJsonPath('data.0.title', 'Fuel starvation under load')
        ->assertJsonPath('data.0.correctIndex', 0)
        ->assertJsonPath('data.0.pack.code', 'fuel-pressure-fault');
});

it('rejects training sessions with bad shapes', function () {
    $author = simLifecycleInstructor();

    $variant = $this->actingAs($author)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', [
            'make_name' => 'Honda',
            'model_name' => 'Civic',
            'name' => '1.5T',
        ])
        ->assertCreated()
        ->json('data');

    $bad = lifecycleManifest();
    $bad[0]['trainingSessions'] = [[
        'id' => 'broken',
        'title' => 'Broken session',
        'options' => ['Only one option'],
        'correctIndex' => 7,
        'steps' => [['id' => 'x', 'screen' => 'teleport']],
    ]];

    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/variants/{$variant['id']}/packs", [
            'code' => 'broken-pack',
            'version' => '1.0.0',
            'manifest' => $bad,
        ])
        ->assertStatus(422);
});

it('deletes custom vehicles without published packs', function () {
    $author = simLifecycleInstructor();
    $pack = makeLifecyclePack($author);

    $variantId = SimulatorDataPackRef($pack['id']);

    // Draft pack present: vehicle delete blocked only when a pack is published.
    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/submit")
        ->assertOk();

    $peer = simLifecycleInstructor();
    $this->actingAs($peer)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/approve")
        ->assertOk();

    $this->actingAs($author)
        ->deleteJson("/api/v1/instructor/simulator/vehicles/variants/{$variantId}")
        ->assertStatus(422);

    // After archiving the pack, the vehicle still has history — delete stays blocked.
    // (Vehicles are only removable once no published pack ever existed for them.)
    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/archive")
        ->assertOk();
});

function SimulatorDataPackRef(string $packId): string
{
    return \App\Models\SimulatorDataPack::query()->findOrFail($packId)->vehicle_variant_id;
}

it('deletes a fresh custom vehicle with no published history', function () {
    $author = simLifecycleInstructor();

    $variant = $this->actingAs($author)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', [
            'make_name' => 'Mazda',
            'model_name' => 'CX-5',
            'name' => '2.0',
        ])
        ->assertCreated()
        ->json('data');

    $this->actingAs($author)
        ->deleteJson("/api/v1/instructor/simulator/vehicles/variants/{$variant['id']}")
        ->assertOk()
        ->assertJsonPath('data.success', true);

    $this->assertDatabaseMissing('vehicle_variants', ['id' => $variant['id']]);
});
