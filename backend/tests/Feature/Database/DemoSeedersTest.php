<?php

namespace Tests\Feature\Database;

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\UserStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Database\Seeders\DemoAccountsSeeder;
use Database\Seeders\DemoCoursesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('seeds one active account for every role with working credentials', function () {
    $this->seed(DemoCoursesSeeder::class);

    foreach (DemoAccountsSeeder::ACCOUNTS as $email => $account) {
        $user = User::query()->where('email', $email)->firstOrFail();

        expect($user->status)->toBe(UserStatus::ACTIVE->value)
            ->and($user->hasVerifiedEmail())->toBeTrue()
            ->and($user->hasRole($account['role']->value))->toBeTrue()
            ->and(Hash::check($account['password'], $user->password))->toBeTrue();
    }

    expect(User::query()->count())->toBe(count(DemoAccountsSeeder::ACCOUNTS));
});

it('seeds three published courses with full curriculum and student enrollments', function () {
    $this->seed(DemoCoursesSeeder::class);

    $courses = Course::query()
        ->with(['instructor', 'categories', 'sections.lessons'])
        ->orderBy('title')
        ->get();

    expect($courses)->toHaveCount(3);

    foreach ($courses as $course) {
        expect($course->status)->toBe(CourseStatus::PUBLISHED)
            ->and($course->visibility)->toBe(Visibility::PUBLIC)
            ->and($course->published_at)->not->toBeNull()
            ->and($course->instructor->email)->toBe('instructor@hbtronics.test')
            ->and($course->categories)->toHaveCount(1)
            ->and($course->sections)->toHaveCount(3)
            ->and($course->sections->flatMap->lessons)->toHaveCount(8);

        expect($course->duration_minutes)->toBe(
            $course->sections
                ->flatMap->lessons
                ->sum('duration_minutes')
        );
    }

    $student = User::query()
        ->where('email', 'student@hbtronics.test')
        ->firstOrFail();

    expect(Enrollment::query()->where('user_id', $student->id)->count())
        ->toBe(3);

    $this->getJson('/api/v1/catalog/courses')
        ->assertOk()
        ->assertJsonCount(3, 'data');

    $this->getJson("/api/v1/catalog/courses/{$courses->first()->id}")
        ->assertOk()
        ->assertJsonPath('data.slug', $courses->first()->slug);
});

it('lets every seeded demo account sign in', function () {
    $this->seed(DemoCoursesSeeder::class);

    foreach (DemoAccountsSeeder::ACCOUNTS as $email => $account) {
        $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => $account['password'],
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email', $email)
            ->assertJsonStructure([
                'data' => ['token', 'token_type'],
            ]);
    }
});

it('is idempotent when the demo seeders are re-run', function () {
    $this->seed(DemoCoursesSeeder::class);
    $this->seed(DemoCoursesSeeder::class);

    expect(Course::query()->count())->toBe(3)
        ->and(User::query()->count())->toBe(count(DemoAccountsSeeder::ACCOUNTS))
        ->and(Enrollment::query()->count())->toBe(3);

    $courses = Course::query()->with('sections.lessons')->get();

    foreach ($courses as $course) {
        expect($course->sections)->toHaveCount(3)
            ->and($course->sections->flatMap->lessons)->toHaveCount(8);
    }
});
