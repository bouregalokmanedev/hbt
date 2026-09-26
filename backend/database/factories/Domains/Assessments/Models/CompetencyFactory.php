<?php

namespace Database\Factories\Domains\Assessments\Models;

use App\Domains\Assessments\Models\Competency;
use Illuminate\Database\Eloquent\Factories\Factory;

final class CompetencyFactory extends Factory
{
    protected $model = Competency::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);
        return [
            'code' => strtoupper(fake()->unique()->lexify('???')),
            'name' => $name,
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['Technical', 'Safety', 'Diagnostic', 'Regulatory']),
        ];
    }
}