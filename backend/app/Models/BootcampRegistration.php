<?php

namespace App\Models;

use App\Enums\Bootcamps\BootcampPaymentMethod;
use App\Enums\Bootcamps\BootcampRegistrationStatus;
use App\Enums\Bootcamps\BootcampSite;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BootcampRegistration extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'bootcamp_id',
        'bootcamp_schedule_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'site',
        'payment_method',
        'terms_accepted',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'site' => BootcampSite::class,
            'payment_method' => BootcampPaymentMethod::class,
            'status' => BootcampRegistrationStatus::class,
            'terms_accepted' => 'boolean',
        ];
    }

    public function bootcamp(): BelongsTo
    {
        return $this->belongsTo(Bootcamp::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(BootcampSchedule::class, 'bootcamp_schedule_id');
    }
}
