<?php

namespace Database\Factories;

use App\Enums\Bootcamps\BootcampPaymentMethod;
use App\Enums\Bootcamps\BootcampRegistrationStatus;
use App\Enums\Bootcamps\BootcampSite;
use App\Models\Bootcamp;
use App\Models\BootcampRegistration;
use App\Models\BootcampSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BootcampRegistration>
 */
class BootcampRegistrationFactory extends Factory
{
    protected $model = BootcampRegistration::class;

    public function definition(): array
    {
        return [
            'bootcamp_id' => Bootcamp::factory(),
            'bootcamp_schedule_id' => BootcampSchedule::factory(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+213 555 000 000',
            'site' => BootcampSite::ALGIERS_HYDRA,
            'payment_method' => BootcampPaymentMethod::CASH,
            'terms_accepted' => true,
            'status' => BootcampRegistrationStatus::PENDING,
        ];
    }
}
