<?php

use App\Models\SimulatorDataPack;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Instructor', 'Student'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function simInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

function validManifest(): array
{
    return [[
        'nodes' => [['id' => 'ECM', 'status' => 'fault', 'dtc' => 2]],
        'dtcs' => [['code' => 'P0087', 'desc' => 'Rail pressure low', 'ecu' => 'ECM', 'status' => 'Current', 'severity' => 'high', 'count' => 2]],
        'pids' => [['id' => 'FRP', 'base' => 8.4, 'fault' => true]],
        'adasDone' => [true, false, false, false, false, false],
    ]];
}

it('lets an instructor build a vehicle variant and a fault pack', function () {
    $instructor = simInstructor();

    $variant = $this->actingAs($instructor)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', [
            'make_name' => 'Toyota',
            'model_name' => 'Corolla',
            'name' => '1.6 16V VVT-i',
            'engine_code' => '1ZR-FE',
            'transmission' => '6 MT',
            'year_from' => 2013,
            'year_to' => 2018,
            'vin' => 'JTNBV58E90J123456',
            'odometer_km' => 98420,
            'coverage' => ['scanner' => 'ok'],
        ])
        ->assertCreated()
        ->assertJsonPath('data.engine_code', '1ZR-FE')
        ->json('data');

    $pack = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/simulator/variants/{$variant['id']}/packs", [
            'code' => 'fuel-pressure-fault',
            'version' => '1.0.0',
            'manifest' => validManifest(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.status', 'draft')
        ->json('data');

    $this->actingAs($instructor)
        ->patchJson("/api/v1/instructor/simulator/packs/{$pack['id']}", [
            'version' => '1.0.1',
        ])
        ->assertOk()
        ->assertJsonPath('data.version', '1.0.1');

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/submit")
        ->assertOk()
        ->assertJsonPath('data.status', 'submitted');
});

it('rejects invalid manifests', function () {
    $instructor = simInstructor();

    $variant = $this->actingAs($instructor)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', [
            'make_name' => 'Toyota',
            'model_name' => 'Yaris',
            'name' => '1.5',
        ])
        ->assertCreated()
        ->json('data');

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/simulator/variants/{$variant['id']}/packs", [
            'code' => 'broken',
            'version' => '1.0.0',
            'manifest' => [['nodes' => [['id' => 'ECM']]]],
        ])
        ->assertStatus(422);
});

it('lets instructors approve submissions, including their own', function () {
    $author = simInstructor();
    $peer = simInstructor();

    $variant = $this->actingAs($author)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', [
            'make_name' => 'Honda',
            'model_name' => 'Civic',
            'name' => '1.5T',
        ])
        ->assertCreated()
        ->json('data');

    $pack = $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/variants/{$variant['id']}/packs", [
            'code' => 'misfire',
            'version' => '1.0.0',
            'manifest' => validManifest(),
        ])
        ->assertCreated()
        ->json('data');

    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/submit")
        ->assertOk();

    // Peer sees it in the review queue and approves.
    $this->actingAs($peer)
        ->getJson('/api/v1/instructor/simulator/review')
        ->assertOk()
        ->assertJsonPath('data.0.id', $pack['id']);

    $this->actingAs($peer)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/approve")
        ->assertOk()
        ->assertJsonPath('data.status', 'published');

    // Author can also approve their own submission.
    $ownPack = $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/variants/{$variant['id']}/packs", [
            'code' => 'misfire-own',
            'version' => '1.0.0',
            'manifest' => validManifest(),
        ])
        ->assertCreated()
        ->json('data');

    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/packs/{$ownPack['id']}/submit")
        ->assertOk();

    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/packs/{$ownPack['id']}/approve")
        ->assertOk()
        ->assertJsonPath('data.status', 'published');

    // Published packs are visible to students via the catalogue.
    $student = User::factory()->create();
    $student->assignRole('Student');
    $this->actingAs($student)
        ->getJson('/api/v1/simulator/catalog')
        ->assertOk()
        ->assertJsonFragment(['code' => 'misfire']);
});

it('rejects submissions with a reason path', function () {
    $author = simInstructor();
    $peer = simInstructor();

    $variant = $this->actingAs($author)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', [
            'make_name' => 'Ford',
            'model_name' => 'Focus',
            'name' => '1.0',
        ])
        ->assertCreated()
        ->json('data');

    $pack = $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/variants/{$variant['id']}/packs", [
            'code' => 'rough-idle',
            'version' => '1.0.0',
            'manifest' => validManifest(),
        ])
        ->assertCreated()
        ->json('data');

    $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/submit")
        ->assertOk();

    $this->actingAs($peer)
        ->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/reject", ['reason' => 'Add freeze-frame evidence.'])
        ->assertOk()
        ->assertJsonPath('data.status', 'rejected');
});

it('blocks students from the builder endpoints', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/instructor/simulator/vehicles')
        ->assertForbidden();

    $this->actingAs($student)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', ['make_name' => 'X', 'model_name' => 'Y', 'name' => 'Z'])
        ->assertForbidden();
});

it('lets authors republish published packs in place but blocks peers', function () {
    $author = simInstructor();
    $peer = simInstructor();

    $variant = $this->actingAs($author)
        ->postJson('/api/v1/instructor/simulator/vehicles/variants', [
            'make_name' => 'Kia',
            'model_name' => 'Rio',
            'name' => '1.4',
        ])
        ->assertCreated()
        ->json('data');

    $pack = $this->actingAs($author)
        ->postJson("/api/v1/instructor/simulator/variants/{$variant['id']}/packs", [
            'code' => 'stall',
            'version' => '1.0.0',
            'manifest' => validManifest(),
        ])
        ->assertCreated()
        ->json('data');

    $this->actingAs($author)->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/submit")->assertOk();
    $this->actingAs($peer)->postJson("/api/v1/instructor/simulator/packs/{$pack['id']}/approve")->assertOk();

    // Author edits a published pack in place — status stays published (republish).
    $this->actingAs($author)
        ->patchJson("/api/v1/instructor/simulator/packs/{$pack['id']}", ['version' => '2.0.0'])
        ->assertOk()
        ->assertJsonPath('data.version', '2.0.0')
        ->assertJsonPath('data.status', 'published');

    // Non-owner peer cannot edit the author's published pack.
    $this->actingAs($peer)
        ->patchJson("/api/v1/instructor/simulator/packs/{$pack['id']}", ['version' => '2.0.1'])
        ->assertForbidden();
});
