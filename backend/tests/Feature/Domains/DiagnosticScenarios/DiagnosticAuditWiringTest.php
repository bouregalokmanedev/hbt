<?php

use App\Domains\DiagnosticScenarios\Events\DiagnosticAttemptStarted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticAttemptSubmitted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticFailed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticHintUsed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticPassed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticResponseSubmitted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticResultGenerated;
use App\Domains\DiagnosticScenarios\Events\DiagnosticStepCompleted;
use App\Domains\DiagnosticScenarios\Listeners\RecordDiagnosticAudit;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('registers diagnostic audit listeners for every diagnostic event', function () {
    Event::fake();

    $listeners = [
        DiagnosticAttemptStarted::class => 'handleAttemptStarted',
        DiagnosticAttemptSubmitted::class => 'handleAttemptSubmitted',
        DiagnosticResponseSubmitted::class => 'handleResponseSubmitted',
        DiagnosticStepCompleted::class => 'handleStepCompleted',
        DiagnosticHintUsed::class => 'handleHintUsed',
        DiagnosticResultGenerated::class => 'handleResultGenerated',
        DiagnosticPassed::class => 'handlePassed',
        DiagnosticFailed::class => 'handleFailed',
    ];

    foreach ($listeners as $event => $method) {
        Event::assertListening(
            $event,
            [RecordDiagnosticAudit::class, $method],
        );
    }
});

it('writes an audit entry when a diagnostic attempt starts', function () {
    $attempt = DiagnosticScenarioAttempt::factory()->create();

    event(new DiagnosticAttemptStarted($attempt));

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'diagnostic.attempt_started',
        'auditable_type' => DiagnosticScenarioAttempt::class,
        'auditable_id' => $attempt->id,
        'user_id' => $attempt->user_id,
    ]);
});
