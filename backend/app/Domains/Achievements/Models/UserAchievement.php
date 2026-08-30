<?php
namespace App\Domains\Achievements\Models;
use App\Models\User; use Illuminate\Database\Eloquent\Model; use Illuminate\Database\Eloquent\Relations\BelongsTo;
class UserAchievement extends Model { protected $fillable = ['user_id','badge','earned_at']; protected function casts(): array { return ['earned_at'=>'datetime']; } public function user(): BelongsTo { return $this->belongsTo(User::class); } }
