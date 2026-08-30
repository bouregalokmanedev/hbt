<?php

namespace App\Domains\Students\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAccountDeletion extends Model
{
    protected $fillable = ['user_id', 'reason', 'other_reason', 'requested_at'];

    protected function casts(): array
    {
        return ['requested_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
