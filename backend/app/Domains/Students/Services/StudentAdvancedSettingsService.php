<?php

namespace App\Domains\Students\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Students\Models\StudentAccountDeletion;
use App\Domains\Students\Models\StudentAssessmentPreference;
use App\Domains\Students\Models\StudentSecuritySetting;
use App\Models\Certificate;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StudentAdvancedSettingsService
{
    public function securityFor(User $user): array
    {
        $security = $user->studentSecuritySetting()->firstOrCreate([], []);

        return [
            'two_factor_enabled' => $security->two_factor_enabled,
            'two_factor_method' => $security->two_factor_method,
            'two_factor_verified_at' => $security->two_factor_verified_at?->toISOString(),
            'active_sessions' => $user->sessions()->count(),
            'email_verified' => $user->hasVerifiedEmail(),
        ];
    }

    public function assessmentFor(User $user): StudentAssessmentPreference
    {
        return $user->studentAssessmentPreference()->firstOrCreate([], []);
    }

    public function updateAssessment(User $user, array $data): StudentAssessmentPreference
    {
        $preferences = $this->assessmentFor($user);
        $preferences->fill($data);
        $preferences->save();

        return $preferences->refresh();
    }

    public function achievementsFor(User $user): array
    {
        $completedCourses = $user->enrollments()->whereNotNull('completed_at')->count();
        $certificates = Certificate::where('user_id', $user->id)->count();
        $passedAssessments = AssessmentAttempt::where('user_id', $user->id)->where('passed', true)->count();

        return [
            'summary' => compact('completedCourses', 'certificates', 'passedAssessments'),
            'certificates' => Certificate::where('user_id', $user->id)->latest('issued_at')->get(['id', 'course_title', 'certificate_number', 'issued_at']),
        ];
    }

    public function exportFor(User $user): array
    {
        return [
            'exported_at' => now()->toISOString(),
            'profile' => $user->only(['uuid', 'first_name', 'last_name', 'username', 'email', 'phone', 'country', 'language', 'timezone', 'created_at']),
            'settings' => app(StudentSettingsService::class)->getFor($user),
            'certificates' => Certificate::where('user_id', $user->id)->get(['certificate_number', 'course_title', 'issued_at']),
            'assessment_history' => AssessmentAttempt::where('user_id', $user->id)->get(['assessment_id', 'score', 'passed', 'completed_at']),
        ];
    }

    public function delete(User $user, array $data): void
    {
        DB::transaction(function () use ($user, $data) {
            StudentAccountDeletion::create([
                'user_id' => $user->id,
                'reason' => $data['reason'],
                'other_reason' => $data['other_reason'] ?? null,
                'requested_at' => now(),
            ]);
            $user->tokens()->delete();
            $user->delete();
        });
    }
}
