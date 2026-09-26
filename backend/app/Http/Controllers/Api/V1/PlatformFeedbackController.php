<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PlatformFeedback;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlatformFeedbackController extends Controller
{
    private const AREAS = ['navigation', 'design', 'performance', 'accessibility', 'simulator', 'other'];

    /** The five simulator benches a review can target. */
    private const LABS = ['scanner', 'multimeter', 'oscilloscope', 'location', 'schematic'];

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'area' => ['nullable', 'string', 'max:50', 'in:'.implode(',', self::AREAS)],
            'lab' => ['nullable', 'string', 'max:50', 'in:'.implode(',', self::LABS)],
        ]);

        $feedback = PlatformFeedback::query()->create([
            'user_id' => $request->user()->id,
            'rating' => $data['rating'],
            'comment' => isset($data['comment']) && $data['comment'] !== '' ? $data['comment'] : null,
            'area' => $data['area'] ?? 'navigation',
            'lab' => $data['lab'] ?? null,
        ]);

        return response()->json(['data' => $feedback], 201);
    }

    /**
     * Latest reviews for one area (used by the Simulator Hub feedback card)
     * plus the aggregate rating summary.
     */
    public function index(Request $request): JsonResponse
    {
        $area = $request->query('area', 'simulator');

        if (! is_string($area) || ! in_array($area, self::AREAS, true)) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => ['area' => ['The selected area is invalid.']]], 422);
        }

        /*
         * Optional lab scope: `all` (default) shows every review in the area,
         * `general` only the ones without a specific lab, otherwise a bench.
         */
        $lab = $request->query('lab', 'all');

        if (! is_string($lab) || ! in_array($lab, array_merge(['all', 'general'], self::LABS), true)) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => ['lab' => ['The selected lab is invalid.']]], 422);
        }

        $scoped = function ($query) use ($lab) {
            if ($lab === 'general') {
                return $query->whereNull('lab');
            }

            if (in_array($lab, self::LABS, true)) {
                return $query->where('lab', $lab);
            }

            return $query;
        };

        /*
         * Reviews come back three per page, newest first. The summary always
         * covers the whole filtered scope, not just the visible page.
         */
        $perPage = min(max($request->integer('per_page', 3), 1), 12);
        $base = $scoped(PlatformFeedback::query()->where('area', $area));

        $summary = (clone $base)
            ->selectRaw('avg(rating) as average, count(*) as count')
            ->first();

        $total = (clone $base)->count();
        $lastPage = max((int) ceil($total / $perPage), 1);
        $page = min(max($request->integer('page', 1), 1), $lastPage);

        $reviews = (clone $base)
            ->with('user:id,first_name,last_name,avatar')
            ->latest()
            ->forPage($page, $perPage)
            ->get()
            ->map(fn (PlatformFeedback $feedback): array => [
                'id' => $feedback->id,
                'rating' => $feedback->rating,
                'comment' => $feedback->comment,
                'lab' => $feedback->lab,
                'created_at' => $feedback->created_at?->toISOString(),
                'author' => [
                    'name' => $this->authorName($feedback->user),
                    'avatar' => $feedback->user?->avatar,
                ],
            ]);

        /*
         * Wrapped in `data` because the web client strips a top-level `data`
         * key (standard { data: ... } envelope), which would drop `summary`.
         */
        return response()->json([
            'data' => [
                'summary' => [
                    'average' => round((float) ($summary->average ?? 0), 1),
                    'count' => (int) ($summary->count ?? 0),
                ],
                'reviews' => $reviews,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => $lastPage,
                ],
            ],
        ]);
    }

    private function authorName(?User $user): string
    {
        if (! $user) {
            return 'Student';
        }

        $name = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));

        return $name !== '' ? $name : 'Student';
    }
}
