<?php

use App\Enums\MediaType;

it('defines the supported media types', function () {
    expect(MediaType::IMAGE->value)->toBe('image')
        ->and(MediaType::VIDEO->value)->toBe('video')
        ->and(MediaType::DOCUMENT->value)->toBe('document');
});