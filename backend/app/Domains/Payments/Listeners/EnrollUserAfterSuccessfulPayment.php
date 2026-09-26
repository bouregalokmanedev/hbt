<?php

namespace App\Domains\Payments\Listeners;

use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Payments\Events\PaymentSucceeded;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Contracts\Queue\ShouldQueue;

class EnrollUserAfterSuccessfulPayment implements ShouldQueue
{
    public function handle(PaymentSucceeded $event): void
    {
        $payment = $event->payment->load('order.items');
        $order = $payment->order;
        if (! $order) {
            return;
        }

        foreach ($order->items as $item) {
            if ($item->purchasable_type !== Course::class) {
                continue;
            }
            $course = Course::find($item->purchasable_id);
            if (! $course) {
                continue;
            }
            $exists = Enrollment::where('user_id', $order->user_id)->where('course_id', $course->id)->exists();
            if ($exists) {
                continue;
            }
            try {
                app(CreateEnrollmentAction::class)->execute($order->user_id, $course);
            } catch (\Throwable $exception) {
                \Log::warning('Enroll after payment failed.', ['order' => $order->id, 'course' => $course->id, 'error' => $exception->getMessage()]);
            }
        }
    }
}
