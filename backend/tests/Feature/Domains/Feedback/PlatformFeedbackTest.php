<?php

use App\Models\PlatformFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('stores authenticated platform experience feedback', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', [
            'rating' => 5,
            'comment' => 'Navigation is clear and fast.',
            'area' => 'navigation',
        ])
        ->assertCreated()
        ->assertJsonPath('data.rating', 5)
        ->assertJsonPath('data.area', 'navigation');

    expect(PlatformFeedback::query()->where('user_id', $student->id)->exists())->toBeTrue();
});

it('rejects platform feedback without a rating', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', ['comment' => 'No rating'])
        ->assertStatus(422);
});

it('rejects platform feedback from guests', function () {
    $this->postJson('/api/v1/platform/feedback', ['rating' => 4])
        ->assertUnauthorized();
});

it('defaults area to navigation when omitted', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', ['rating' => 3])
        ->assertCreated()
        ->assertJsonPath('data.area', 'navigation');
});

it('stores simulator-area feedback for the hub', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', [
            'rating' => 5,
            'comment' => 'The scanner lab is excellent.',
            'area' => 'simulator',
        ])
        ->assertCreated()
        ->assertJsonPath('data.area', 'simulator');

    expect(PlatformFeedback::query()->where('area', 'simulator')->where('user_id', $student->id)->exists())->toBeTrue();
});

it('lists simulator reviews with a rating summary', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', [
            'rating' => 4,
            'comment' => 'Great oscilloscope exercises.',
            'area' => 'simulator',
        ])
        ->assertCreated();

    $response = $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=simulator')
        ->assertOk();

    expect((float) $response->json('data.summary.average'))->toBe(4.0);
    expect($response->json('data.summary.count'))->toBe(1);
    expect($response->json('data.reviews.0.comment'))->toBe('Great oscilloscope exercises.');
    expect($response->json('data.reviews.0.author.name'))->not->toBeEmpty();
});

it('rejects an unknown feedback area when listing', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=unknown-area')
        ->assertStatus(422);
});

it('rejects feedback listing from guests', function () {
    $this->getJson('/api/v1/platform/feedback?area=simulator')->assertUnauthorized();
});

it('stores a simulator review for a specific lab', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', [
            'rating' => 5,
            'comment' => 'Freeze-frame decoding is spot on.',
            'area' => 'simulator',
            'lab' => 'scanner',
        ])
        ->assertCreated()
        ->assertJsonPath('data.lab', 'scanner');

    expect(PlatformFeedback::query()->where('lab', 'scanner')->exists())->toBeTrue();
});

it('rejects an unknown lab when storing', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', [
            'rating' => 5,
            'area' => 'simulator',
            'lab' => 'teleporter',
        ])
        ->assertStatus(422);
});

it('stores a lab-agnostic review as general', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', [
            'rating' => 4,
            'area' => 'simulator',
        ])
        ->assertCreated()
        ->assertJsonPath('data.lab', null);
});

it('filters reviews and summary by lab', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    foreach ([['scanner', 5], ['multimeter', 3], ['scanner', 4]] as [$lab, $rating]) {
        $this->actingAs($student)
            ->postJson('/api/v1/platform/feedback', [
                'rating' => $rating,
                'area' => 'simulator',
                'lab' => $lab,
            ])
            ->assertCreated();
    }

    $scanner = $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=simulator&lab=scanner')
        ->assertOk();

    expect((float) $scanner->json('data.summary.average'))->toBe(4.5);
    expect($scanner->json('data.summary.count'))->toBe(2);
    expect(collect($scanner->json('data.reviews'))->pluck('lab')->unique()->all())->toBe(['scanner']);

    $all = $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=simulator&lab=all')
        ->assertOk();

    expect($all->json('data.summary.count'))->toBe(3);
});

it('returns only lab-agnostic reviews for lab=general', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', ['rating' => 5, 'area' => 'simulator', 'lab' => 'oscilloscope'])
        ->assertCreated();

    $this->actingAs($student)
        ->postJson('/api/v1/platform/feedback', ['rating' => 4, 'area' => 'simulator'])
        ->assertCreated();

    $general = $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=simulator&lab=general')
        ->assertOk();

    expect($general->json('data.summary.count'))->toBe(1);
    expect($general->json('data.reviews.0.lab'))->toBeNull();
});

it('rejects an unknown lab when listing reviews', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=simulator&lab=teleporter')
        ->assertStatus(422);
});

it('returns reviews three per page with pagination meta', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);

    $ids = [];
    foreach ([5, 4, 3, 2, 1] as $rating) {
        $response = $this->actingAs($student)
            ->postJson('/api/v1/platform/feedback', [
                'rating' => $rating,
                'comment' => "Review {$rating}",
                'area' => 'simulator',
                'lab' => 'scanner',
            ])
            ->assertCreated();
        $ids[] = $response->json('data.id');
    }

    // Stagger timestamps so "newest first" ordering is deterministic.
    foreach ($ids as $index => $id) {
        $row = PlatformFeedback::query()->findOrFail($id);
        $row->created_at = now()->subMinutes($index);
        $row->save();
    }

    $pageOne = $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=simulator&page=1')
        ->assertOk();

    expect($pageOne->json('data.reviews'))->toHaveCount(3);
    expect($pageOne->json('data.meta.page'))->toBe(1);
    expect($pageOne->json('data.meta.per_page'))->toBe(3);
    expect($pageOne->json('data.meta.total'))->toBe(5);
    expect($pageOne->json('data.meta.last_page'))->toBe(2);
    expect($pageOne->json('data.reviews.0.comment'))->toBe('Review 5');
    expect($pageOne->json('data.summary.count'))->toBe(5);

    $pageTwo = $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=simulator&page=2')
        ->assertOk();

    expect($pageTwo->json('data.reviews'))->toHaveCount(2);
    expect($pageTwo->json('data.meta.page'))->toBe(2);
    expect($pageTwo->json('data.reviews.1.comment'))->toBe('Review 1');

    $clamped = $this->actingAs($student)
        ->getJson('/api/v1/platform/feedback?area=simulator&page=9')
        ->assertOk();

    expect($clamped->json('data.meta.page'))->toBe(2);
});
