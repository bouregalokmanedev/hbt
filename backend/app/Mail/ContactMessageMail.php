<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ContactMessage $contactMessage,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Contact] '.$this->contactMessage->subject,
            replyTo: [
                $this->contactMessage->email,
            ],
        );
    }

    public function content(): Content
    {
        $message = $this->contactMessage;

        $rows = [
            'Name' => e($message->full_name),
            'Email' => e($message->email),
            'Phone' => e($message->phone ?: '—'),
            'Inquiry type' => e($message->inquiry ?: '—'),
            'Subject' => e($message->subject),
            'Received' => e(optional($message->created_at)->toDateTimeString() ?? now()->toDateTimeString()),
        ];

        $rowsHtml = '';
        foreach ($rows as $label => $value) {
            $rowsHtml .= "<tr><td style=\"padding:8px 12px;border:1px solid #e5e5e5;background:#f7f7f7;font-weight:bold;width:140px;\">{$label}</td><td style=\"padding:8px 12px;border:1px solid #e5e5e5;\">{$value}</td></tr>";
        }

        $body = nl2br(e($message->message));

        return new Content(
            htmlString: <<<HTML
                <div style="font-family:Arial,Helvetica,sans-serif;color:#3a3a3a;max-width:640px;">
                    <h2 style="color:#f47822;margin:0 0 4px;">New contact message</h2>
                    <p style="margin:0 0 16px;color:#777;">Someone reached out through the HBTronics contact form.</p>
                    <table style="border-collapse:collapse;width:100%;font-size:14px;">{$rowsHtml}</table>
                    <h3 style="margin:20px 0 8px;">Message</h3>
                    <div style="border:1px solid #e5e5e5;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.6;">{$body}</div>
                    <p style="margin:16px 0 0;font-size:12px;color:#999;">Reply directly to this email to answer {$rows['Name']}.</p>
                </div>
                HTML,
        );
    }
}
