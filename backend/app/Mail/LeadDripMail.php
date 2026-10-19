<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * One of three timed follow-ups the sales pipeline sends to open leads:
 * 1 = thank-you + resources, 2 = pricing nudge (with a live coupon when
 * one exists), 3 = social proof. Gated by config('marketing.drip.enabled').
 */
class LeadDripMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ContactMessage $lead,
        public readonly int $level,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: match ($this->level) {
                1 => 'Thanks for reaching out — here is what happens next',
                2 => $this->hasLiveCoupon()
                    ? 'A little help choosing the right course (inside: a code for you)'
                    : 'Still deciding? Here is how to choose the right course',
                default => 'How students like you landed their first project',
            },
            replyTo: ['sales@hbtronics.dz'],
        );
    }

    public function content(): Content
    {
        $name = e($this->lead->first_name ?: 'there');
        $course = e($this->lead->course_interest ?: '');
        $courseNote = $course !== '' ? ' about <strong>'.$course.'</strong>' : '';
        $frontend = rtrim((string) config('app.frontend_url', 'https://hbtronics.dz'), '/');
        $coupon = $this->liveCouponCode();

        $body = match ($this->level) {
            1 => <<<HTML
                <p style="margin:0 0 14px;">Hi {$name},</p>
                <p style="margin:0 0 14px;">Thanks for reaching out{$courseNote}. Our team has your message and a specialist will follow up shortly.</p>
                <p style="margin:0 0 18px;">While you wait, you can browse the catalog and try the simulator — no account needed.</p>
                <p style="margin:0;"><a href="{$frontend}/courses" style="background:#F47822;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Browse courses</a></p>
                HTML,
            2 => $coupon !== null
                ? <<<HTML
                    <p style="margin:0 0 14px;">Hi {$name},</p>
                    <p style="margin:0 0 14px;">Still comparing options? Use code <strong style="color:#F47822;">{$coupon}</strong> at checkout for a better price on your first enrollment.</p>
                    <p style="margin:0 0 18px;">Every course includes lifetime access, hands-on labs and a verified certificate.</p>
                    <p style="margin:0;"><a href="{$frontend}/pricing" style="background:#F47822;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">See pricing</a></p>
                    HTML
                : <<<HTML
                    <p style="margin:0 0 14px;">Hi {$name},</p>
                    <p style="margin:0 0 14px;">Choosing a course is a real decision. If you tell us your goal — job change, graduation project, freelance — we will point you to the shortest path.</p>
                    <p style="margin:0 0 18px;">Reply to this email and a specialist will answer personally.</p>
                    <p style="margin:0;"><a href="{$frontend}/pricing" style="background:#F47822;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Compare plans</a></p>
                    HTML,
            default => <<<HTML
                <p style="margin:0 0 14px;">Hi {$name},</p>
                <p style="margin:0 0 14px;">Students who started where you are now have shipped real diagnostic tools, embedded firmware and AI prototypes — many landed internships or freelance work within months.</p>
                <p style="margin:0 0 18px;">The difference is practice: labs, scenarios and projects instead of videos alone.</p>
                <p style="margin:0;"><a href="{$frontend}/courses" style="background:#F47822;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Start with a free lesson</a></p>
                HTML,
        };

        return new Content(
            htmlString: <<<HTML
                <div style="font-family:Arial,Helvetica,sans-serif;color:#3a3a3a;max-width:600px;">
                    <div style="height:4px;background:#F47822;border-radius:2px;margin-bottom:24px;"></div>
                    <h2 style="margin:0 0 16px;font-size:20px;">HBTronics</h2>
                    {$body}
                    <p style="margin:28px 0 0;font-size:12px;color:#999;">You are receiving this because you contacted HBTronics. Our sales team may also follow up personally.</p>
                </div>
                HTML,
        );
    }

    private function hasLiveCoupon(): bool
    {
        return $this->liveCouponCode() !== null;
    }

    private function liveCouponCode(): ?string
    {
        $discount = \App\Domains\Marketing\Models\Discount::query()
            ->where('active', true)
            ->where('code', '!=', '')
            ->get()
            ->first(fn ($candidate) => $candidate->isLive());

        return $discount?->code;
    }
}
