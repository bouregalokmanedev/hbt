<?php

use App\Domains\AI\Services\MentorTokenEstimator;

it('estimates empty text as zero tokens', function () {
    $estimator = app(MentorTokenEstimator::class);

    expect($estimator->estimate(''))
        ->toBe(0);
});

it('estimates text using a predictable approximation', function () {
    $estimator = app(MentorTokenEstimator::class);

    $text = str_repeat('a', 100);

    expect($estimator->estimate($text))
        ->toBe(25);
});

it('rounds token estimates up', function () {
    $estimator = app(MentorTokenEstimator::class);

    expect($estimator->estimate('abcde'))
        ->toBe(2);
});

it('estimates a collection of messages', function () {
    $estimator = app(MentorTokenEstimator::class);

    $messages = [
        [
            'role' => 'user',
            'content' => 'Hello',
        ],
        [
            'role' => 'assistant',
            'content' => 'Hello, how can I help you?',
        ],
    ];

    $result = $estimator->estimateMessages($messages);

    expect($result)
        ->toBeGreaterThan(0);
});

it('handles messages with missing content', function () {
    $estimator = app(MentorTokenEstimator::class);

    $messages = [
        [
            'role' => 'user',
        ],
    ];

    expect($estimator->estimateMessages($messages))
        ->toBe(4);
});