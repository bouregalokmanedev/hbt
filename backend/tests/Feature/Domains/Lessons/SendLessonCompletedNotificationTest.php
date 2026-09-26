<?php

use App\Domains\Lessons\Events\LessonCompleted;
use App\Domains\Lessons\Listeners\SendLessonCompletedNotification;
use App\Domains\Notifications\Models\StudentNotification;
use App\Mail\StudentNotificationMail;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('sends a personalized lesson completed notification when a lesson is completed', function () {
    Mail::fake();

    $user = User::factory()->create(['first_name' => 'Karim']);
    $course = Course::factory()->create(['title' => 'Circuit Analysis']);
    $section = Section::factory()->create(['course_id' => $course->id, 'title' => 'Basics']);
    $lesson = Lesson::factory()->create(['section_id' => $section->id, 'title' => 'Kirchhoff Laws']);

    $progress = LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now(),
        'progress_percentage' => 100,
    ]);

    event(new LessonCompleted($progress));

    $notification = StudentNotification::query()
        ->where('user_id', $user->id)
        ->where('type', 'lesson_completed')
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->title)->toBe('Lesson completed')
        ->and($notification->message)->toContain('Kirchhoff Laws')
        ->and($notification->message)->toContain('Circuit Analysis')
        ->and($notification->action_url)->toBe('/my-courses/'.$course->id);

    Mail::assertQueued(StudentNotificationMail::class, function (StudentNotificationMail $mail) use ($user) {
        return $mail->firstName === 'Karim'
            && $mail->type === 'lesson_completed';
    });
});

it('is registered on the LessonCompleted event', function () {
    expect(collect(config('app.providers')))
        ->not->toBeEmpty();

    // Listener resolves without error.
    expect(app(SendLessonCompletedNotification::class))->toBeInstanceOf(SendLessonCompletedNotification::class);
});
