<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Support\Models\SupportMail;
use App\Mail\ContactMessageMail;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'inquiry' => ['nullable', 'string', 'max:100'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            'visitor_id' => ['nullable', 'uuid'],
            'source' => ['nullable', 'string', 'max:50'],
            'course_interest' => ['nullable', 'string', 'max:255'],
            'utm_source' => ['nullable', 'string', 'max:100'],
            'utm_medium' => ['nullable', 'string', 'max:100'],
            'utm_campaign' => ['nullable', 'string', 'max:100'],
            'utm_term' => ['nullable', 'string', 'max:100'],
            'utm_content' => ['nullable', 'string', 'max:100'],
        ]);

        $contactMessage = ContactMessage::create([
            ...$data,
            'source' => $data['source'] ?? 'contact_form',
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
        ]);

        // Mirror the submission into the support mailbox (inbox root). The
        // public contact endpoint must never fail because of the mailbox.
        try {
            SupportMail::create([
                'direction' => SupportMail::DIRECTION_INBOUND,
                'subject' => $contactMessage->subject,
                'body' => $contactMessage->message,
                'from_name' => $contactMessage->full_name,
                'from_email' => $contactMessage->email,
                'to_email' => (string) config('mail.contact_to', 'support@hbtronics.dz'),
                'contact_message_id' => $contactMessage->id,
            ]);
        } catch (\Throwable $exception) {
            Log::warning('Support mailbox mirror failed.', [
                'contact_message_id' => $contactMessage->id,
                'error' => $exception->getMessage(),
            ]);
        }

        try {
            Mail::to(config('mail.contact_to', 'support@hbtronics.dz'))
                ->send(new ContactMessageMail($contactMessage->fresh()));
        } catch (\Throwable $exception) {
            Log::warning('Contact message email failed to send.', [
                'contact_message_id' => $contactMessage->id,
                'error' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your message has been sent. Our team will get back to you soon.',
            'data' => [
                'id' => $contactMessage->id,
            ],
        ], 201);
    }
}
