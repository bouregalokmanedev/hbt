<?php

namespace App\Domains\Bootcamps\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class BootcampRegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bootcamp_id' => $this->bootcamp_id,
            'bootcamp_schedule_id' => $this->bootcamp_schedule_id,

            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,

            'site' => $this->site->value,
            'payment_method' => $this->payment_method->value,
            'terms_accepted' => $this->terms_accepted,
            'status' => $this->status->value,

            'created_at' => $this->created_at?->toISOString(),

            'schedule' => $this->whenLoaded(
                'schedule',
                fn () => new BootcampScheduleResource($this->schedule)
            ),

            'bootcamp' => $this->whenLoaded('bootcamp', fn () => [
                'id' => $this->bootcamp->id,
                'title' => $this->bootcamp->title,
                'slug' => $this->bootcamp->slug,
            ]),
        ];
    }
}
