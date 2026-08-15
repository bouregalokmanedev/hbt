<?php

namespace Database\Factories;

use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SectionProgressFactory extends Factory
{
    protected $model = SectionProgress::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'section_id' => Section::factory(),
            'started_at' => null,
            'progress_percentage' => 0,
            'time_spent' => 0,
            'completed_at' => null,
        ];
    }
}