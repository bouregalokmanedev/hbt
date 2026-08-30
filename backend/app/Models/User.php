<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Domains\Students\Models\StudentSetting;
use App\Domains\Students\Models\StudentNotificationSetting;
use App\Domains\Students\Models\StudentPrivacySetting;
use App\Domains\Students\Models\StudentLearningPreference;
use App\Domains\Students\Models\StudentSecuritySetting;
use App\Domains\Students\Models\StudentAssessmentPreference;

use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory;
    use HasApiTokens;
    use HasRoles;
    use Notifiable;
    use SoftDeletes;

    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'uuid',
        'first_name',
        'last_name',
        'username',
        'email',
        'phone',
        'avatar',
        'bio',
        'country',
        'language',
        'timezone',
        'status',
        'password',
    ];

    /**
     * Hidden attributes.
     */
    protected $hidden = [
        'id',
        'password',
        'remember_token',
    ];

    /**
     * Attribute casting.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Automatically generate UUID.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Accessor: Full name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
    public function getRouteKeyName(): string
{
    return 'uuid';
}

    public function sendPasswordResetNotification($token): void
{
    $this->notify(
        new ResetPasswordNotification($token)
    );
}

public function sessions()
{
    return $this->hasMany(UserSession::class);
}
public function lessonProgress(): HasMany
{
    return $this->hasMany(
        LessonProgress::class
    );
}
public function diagnosticScenarioAttempts(): HasMany
{
    return $this->hasMany(
        DiagnosticScenarioAttempt::class,
        'user_id'
    );
}
public function enrollments(): HasMany
{
    return $this->hasMany(Enrollment::class);
}
public function studentSetting(): HasOne
{
    return $this->hasOne(StudentSetting::class);
}

public function studentNotificationSetting(): HasOne
{
    return $this->hasOne(StudentNotificationSetting::class);
}

public function studentPrivacySetting(): HasOne
{
    return $this->hasOne(StudentPrivacySetting::class);
}

public function studentLearningPreference(): HasOne
{
    return $this->hasOne(StudentLearningPreference::class);
}
public function studentSecuritySetting(): HasOne
{
    return $this->hasOne(StudentSecuritySetting::class);
}
public function studentAssessmentPreference(): HasOne
{
    return $this->hasOne(StudentAssessmentPreference::class);
}
}
