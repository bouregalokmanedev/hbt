<?php

namespace App\Domains\Payments\Controllers;

use App\Domains\Payments\Actions\PurchaseCourseAction;
use App\Domains\Payments\Models\Purchase;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::query()
            ->with('course:id,title,thumbnail')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (Purchase $purchase) => [
                'id' => $purchase->id,
                'course' => $purchase->course?->title,
                'course_id' => $purchase->course_id,
                'amount' => $purchase->amount,
                'currency' => $purchase->currency,
                'status' => $purchase->status->value,
                'created_at' => $purchase->created_at?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Purchases retrieved.',
            'data' => $purchases,
        ]);
    }

    public function store(Request $request, PurchaseCourseAction $purchase): JsonResponse
    {
        $data = $request->validate([
            'course_id' => ['required', 'uuid', 'exists:courses,id'],
        ]);

        $course = Course::query()->findOrFail($data['course_id']);

        $record = $purchase->execute($request->user(), $course);

        return response()->json([
            'success' => true,
            'message' => $record->amount === 0
                ? 'Enrolled successfully.'
                : 'Purchase created. Complete the payment and an administrator will confirm your access.',
            'data' => [
                'id' => $record->id,
                'status' => $record->status->value,
                'amount' => $record->amount,
                'currency' => $record->currency,
            ],
        ], 201);
    }
}
