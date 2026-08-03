<?php

namespace Database\Factories;

use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        return [
            'uploaded_by' => \App\Models\User::factory(),
            'disk' => 'public',
            'path' => 'media/example.jpg',
            'original_name' => 'example.jpg',
            'filename' => 'example.jpg',
            'mime_type' => 'image/jpeg',
            'extension' => 'jpg',
            'size' => 1024,
            'type' => \App\Enums\MediaType::IMAGE,
            'metadata' => null,
        ];
    }
}