<?php

namespace App\Domains\Marketing\Controllers;

use App\Domains\Marketing\Models\Discount;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class DiscountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Discount::query()->latest()->get()->map(fn (Discount $discount) => $this->serialize($discount)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:40', 'unique:discounts,code'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['required', Rule::in(['percent', 'fixed'])],
            'value' => ['required', 'integer', 'min:1'],
            'currency' => ['nullable', 'string', 'size:3'],
            'applies_to' => ['required', Rule::in(['all', 'courses', 'plans'])],
            'course_ids' => ['nullable', 'array', 'max:50'],
            'course_ids.*' => ['uuid', 'exists:courses,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['code'])) {
            $data['code'] = strtoupper(trim((string) $data['code']));
        }
        if (($data['type'] ?? null) === 'percent') {
            $request->validate(['value' => ['max:100']]);
        }
        $data['created_by'] = $request->user()->id;

        $discount = Discount::query()->create($data);

        return response()->json(['data' => $this->serialize($discount->fresh())], 201);
    }

    public function show(Discount $discount): JsonResponse
    {
        return response()->json(['data' => $this->serialize($discount)]);
    }

    public function update(Request $request, Discount $discount): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:40', Rule::unique('discounts', 'code')->ignore($discount->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['sometimes', Rule::in(['percent', 'fixed'])],
            'value' => ['sometimes', 'integer', 'min:1'],
            'currency' => ['nullable', 'string', 'size:3'],
            'applies_to' => ['sometimes', Rule::in(['all', 'courses', 'plans'])],
            'course_ids' => ['nullable', 'array', 'max:50'],
            'course_ids.*' => ['uuid', 'exists:courses,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('code', $data) && $data['code'] !== null) {
            $data['code'] = strtoupper(trim((string) $data['code']));
        }

        $discount->update($data);

        return response()->json(['data' => $this->serialize($discount->fresh())]);
    }

    public function destroy(Discount $discount): JsonResponse
    {
        $discount->delete();

        return response()->json(['message' => 'Campaign deleted.']);
    }

    /**
     * Public code check used by checkout before payment.
     */
    public function validate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
            'course_ids' => ['sometimes', 'array', 'max:50'],
            'course_ids.*' => ['uuid'],
            'subtotal' => ['sometimes', 'integer', 'min:0'],
        ]);

        $discount = Discount::query()
            ->where('code', strtoupper(trim($data['code'])))
            ->first();

        if (! $discount || ! $discount->isLive()) {
            return response()->json(['success' => false, 'message' => 'This code is invalid or expired.'], 422);
        }

        $lines = collect($data['course_ids'] ?? [])->map(fn ($id) => [
            'course_id' => $id,
            'unit_price' => 0,
            'quantity' => 1,
        ])->all();
        $previewBase = (int) ($data['subtotal'] ?? 0);
        $amount = $lines === []
            ? ($discount->type === 'fixed' ? min((int) $discount->value, $previewBase) : (int) floor($previewBase * min((int) $discount->value, 100) / 100))
            : $discount->amountFor($lines);

        if ($discount->applies_to === 'courses' && $lines !== [] && $amount === 0) {
            return response()->json(['success' => false, 'message' => 'This code does not apply to these courses.'], 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $discount->id,
                'name' => $discount->name,
                'type' => $discount->type,
                'value' => $discount->value,
                'estimated_amount' => $amount,
            ],
        ]);
    }

    private function serialize(Discount $discount): array
    {
        return [
            'id' => $discount->id,
            'name' => $discount->name,
            'code' => $discount->code,
            'description' => $discount->description,
            'type' => $discount->type,
            'value' => $discount->value,
            'currency' => $discount->currency,
            'applies_to' => $discount->applies_to,
            'course_ids' => $discount->course_ids ?? [],
            'starts_at' => $discount->starts_at?->toISOString(),
            'ends_at' => $discount->ends_at?->toISOString(),
            'max_uses' => $discount->max_uses,
            'used_count' => $discount->used_count,
            'active' => (bool) $discount->active,
            'live' => $discount->isLive(),
            'created_at' => $discount->created_at?->toISOString(),
        ];
    }
}
