<?php

namespace App\Domains\Students\Controllers;

use App\Domains\Students\Requests\DeleteStudentAccountRequest;
use App\Domains\Students\Requests\UpdateAssessmentPreferenceRequest;
use App\Domains\Students\Services\StudentAdvancedSettingsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\AuthenticationLog;
use App\Services\Security\OtpService;
use App\Notifications\TwoFactorCodeNotification;
use App\Services\Security\TwoFactorDeliveryService;

class StudentAdvancedSettingsController extends Controller
{
    public function __construct(private readonly StudentAdvancedSettingsService $service) {}

    public function security(Request $request): JsonResponse { return response()->json(['data' => $this->service->securityFor($request->user())]); }
    public function loginActivity(Request $request): JsonResponse
    {
        $query = AuthenticationLog::where('user_id', $request->user()->id)->latest();
        if (! $request->boolean('all')) $query->take(3);
        return response()->json(['data' => $query->get(['id', 'event', 'successful', 'ip_address', 'browser', 'platform', 'device_type', 'created_at'])]);
    }
    public function enableTwoFactor(Request $request, OtpService $otp, TwoFactorDeliveryService $delivery): JsonResponse
    {
        abort_unless($request->user()->hasVerifiedEmail(), 422, 'Verify your email before enabling two-factor authentication.');
        $data = $request->validate(['method' => ['required', 'in:email,phone']]);
        $record = $otp->generate($request->user(), 'two_factor_enable');
        $delivery->send($request->user(), $record->code, $data['method']);
        return response()->json(['message' => 'A verification code was sent to your '.($data['method'] === 'phone' ? 'phone number' : 'email').'.', 'data' => ['verification_required' => true, 'method' => $data['method']]]);
    }
    public function verifyTwoFactor(Request $request, OtpService $otp): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'digits:6'], 'method' => ['required', 'in:email,phone']]);
        abort_unless($otp->verify($request->user(), 'two_factor_enable', $data['code']), 422, 'That verification code is invalid or expired.');
        $setting = $request->user()->studentSecuritySetting()->firstOrCreate([], []);
        $setting->update(['two_factor_enabled' => true, 'two_factor_method' => $data['method'], 'two_factor_verified_at' => now()]);
        return response()->json(['message' => 'Two-factor authentication is enabled.', 'data' => $this->service->securityFor($request->user())]);
    }
    public function disableTwoFactor(Request $request): JsonResponse
    {
        $setting = $request->user()->studentSecuritySetting()->firstOrCreate([], []);
        $setting->update(['two_factor_enabled' => false, 'two_factor_method' => null, 'two_factor_verified_at' => null]);
        return response()->json(['message' => 'Two-factor authentication is disabled.', 'data' => $this->service->securityFor($request->user())]);
    }
    public function achievements(Request $request): JsonResponse { return response()->json(['data' => $this->service->achievementsFor($request->user())]); }
    public function assessment(Request $request): JsonResponse { return response()->json(['data' => $this->service->assessmentFor($request->user())]); }
    public function updateAssessment(UpdateAssessmentPreferenceRequest $request): JsonResponse { return response()->json(['data' => $this->service->updateAssessment($request->user(), $request->validated())]); }
    public function export(Request $request): JsonResponse { return response()->json(['data' => $this->service->exportFor($request->user())]); }
    public function destroy(DeleteStudentAccountRequest $request): JsonResponse
    {
        $this->service->delete($request->user(), $request->validated());
        return response()->json(['message' => 'Your account has been deleted. We are sorry to see you go.']);
    }
}
