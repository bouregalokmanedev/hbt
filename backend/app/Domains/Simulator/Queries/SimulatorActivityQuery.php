<?php

namespace App\Domains\Simulator\Queries;

use App\Domains\Simulator\Models\SimulatorResult;
use App\Domains\Simulator\Models\SimulatorSession;
use App\Domains\Simulator\Support\VehicleKey;
use App\Models\User;
use App\Models\VehicleVariant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Instructor/admin read model over simulator_sessions + simulator_results.
 * Instructor scoping: only sessions for students enrolled in the instructor's
 * owned (non-cancelled) courses — mirrors InstructorStudentQuery ownership.
 */
final class SimulatorActivityQuery
{
    public function __construct(private readonly ?int $instructorId = null)
    {
    }

    public static function forInstructor(int $instructorId): self
    {
        return new self($instructorId);
    }

    public static function forAdmin(): self
    {
        return new self(null);
    }

    /**
     * Aggregates are computed in SQL so the query stays O(1) in memory no
     * matter how many sessions/results exist.
     */
    public function analytics(): array
    {
        $sessionTotals = $this->scopedSessions()
            ->selectRaw('COUNT(*) as sessions')
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed")
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active")
            ->selectRaw('COUNT(DISTINCT user_id) as students')
            ->toBase()
            ->first();

        $resultTotals = $this->scopedResults()
            ->selectRaw('COUNT(*) as results')
            ->selectRaw("COALESCE(SUM(CASE WHEN outcome = 'pass' THEN 1 ELSE 0 END), 0) as passed")
            ->selectRaw('AVG(score) as average_score')
            ->selectRaw('AVG(hints_used) as average_hints')
            ->selectRaw('AVG(duration_seconds) as average_duration')
            ->selectRaw('COALESCE(SUM(duration_seconds), 0) as total_duration')
            ->toBase()
            ->first();

        $sessionsByTool = $this->scopedSessions()
            ->selectRaw('tool')
            ->selectRaw('COUNT(*) as sessions')
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed")
            ->groupBy('tool')
            ->toBase()
            ->get()
            ->keyBy('tool');

        $resultsByTool = $this->scopedResults()
            ->selectRaw('tool')
            ->selectRaw('COUNT(*) as results')
            ->selectRaw("COALESCE(SUM(CASE WHEN outcome = 'pass' THEN 1 ELSE 0 END), 0) as passed")
            ->selectRaw('AVG(score) as average_score')
            ->selectRaw('AVG(hints_used) as average_hints')
            ->selectRaw('AVG(duration_seconds) as average_duration')
            ->groupBy('tool')
            ->toBase()
            ->get()
            ->keyBy('tool');

        $byTool = collect(['scanner', 'multimeter', 'oscilloscope', 'location', 'schematic'])
            ->map(function (string $tool) use ($sessionsByTool, $resultsByTool) {
                $sessionRow = $sessionsByTool->get($tool);
                $resultRow = $resultsByTool->get($tool);
                $resultsCount = (int) ($resultRow->results ?? 0);

                return [
                    'tool' => $tool,
                    'sessions' => (int) ($sessionRow->sessions ?? 0),
                    'completed' => (int) ($sessionRow->completed ?? 0),
                    'results' => $resultsCount,
                    'average_score' => $resultsCount > 0
                        ? (int) round((float) $resultRow->average_score)
                        : 0,
                    'pass_rate' => $resultsCount > 0
                        ? (int) round((($resultRow->passed ?? 0) / $resultsCount) * 100)
                        : 0,
                    'average_hints' => $resultsCount > 0
                        ? round((float) $resultRow->average_hints, 1)
                        : 0.0,
                    'average_duration_seconds' => $resultsCount > 0
                        ? (int) round((float) $resultRow->average_duration)
                        : 0,
                ];
            })
            ->values()
            ->all();

        $resultsCount = (int) ($resultTotals->results ?? 0);

        return [
            'totals' => [
                'sessions' => (int) ($sessionTotals->sessions ?? 0),
                'completed' => (int) ($sessionTotals->completed ?? 0),
                'active' => (int) ($sessionTotals->active ?? 0),
                'results' => $resultsCount,
                'students' => (int) ($sessionTotals->students ?? 0),
                'average_score' => $resultsCount > 0
                    ? (int) round((float) $resultTotals->average_score)
                    : 0,
                'pass_rate' => $resultsCount > 0
                    ? (int) round((($resultTotals->passed ?? 0) / $resultsCount) * 100)
                    : 0,
                'average_hints' => $resultsCount > 0
                    ? round((float) $resultTotals->average_hints, 1)
                    : 0.0,
                'average_duration_seconds' => $resultsCount > 0
                    ? (int) round((float) $resultTotals->average_duration)
                    : 0,
                'total_duration_seconds' => (int) ($resultTotals->total_duration ?? 0),
            ],
            'by_tool' => $byTool,
            'by_vehicle' => $this->vehicleBreakdown(),
        ];
    }

    /**
     * Session counts for EVERY created vehicle (vehicle catalog) merged with
     * any legacy vehicle_key values found on sessions. Vehicles that were
     * created but never used appear with 0 sessions so dropdowns can list
     * all created vehicles, not only ones with activity.
     *
     * @return array<int, array{vehicle_key: string, sessions: int, label: string|null}>
     */
    private function vehicleBreakdown(): array
    {
        $counts = $this->scopedSessions()
            ->whereNotNull('vehicle_key')
            ->where('vehicle_key', '!=', '')
            ->selectRaw('vehicle_key')
            ->selectRaw('COUNT(*) as sessions')
            ->groupBy('vehicle_key')
            ->toBase()
            ->get();

        $variants = VehicleVariant::query()
            ->with('model.make')
            ->get()
            ->keyBy('id');

        // Sessions may carry the lab card key (`backend:<uuid>`), a bare
        // variant id, or a static id (`golf`). Grouping on the canonical form
        // keeps one vehicle = one row instead of a prefixed row with sessions
        // plus an unlabelled duplicate with 0.
        $sessionsByKey = [];
        foreach ($counts as $row) {
            $key = VehicleKey::normalize((string) $row->vehicle_key);
            if ($key === '') {
                continue;
            }
            $sessionsByKey[$key] = ($sessionsByKey[$key] ?? 0) + (int) $row->sessions;
        }

        $rows = collect($sessionsByKey)->map(function (int $sessions, string $key) use ($variants) {
            return [
                'vehicle_key' => $key,
                'sessions' => $sessions,
                'label' => $this->vehicleLabel($variants->get($key)),
            ];
        });

        foreach ($variants as $variantId => $variant) {
            $key = (string) $variantId;
            if (isset($sessionsByKey[$key])) {
                continue;
            }
            $rows->push([
                'vehicle_key' => $key,
                'sessions' => 0,
                'label' => $this->vehicleLabel($variant),
            ]);
        }

        return $rows
            ->sortBy(fn (array $row) => [-$row['sessions'], $row['label'] ?? $row['vehicle_key']])
            ->values()
            ->all();
    }

    private function vehicleLabel(?VehicleVariant $variant): ?string
    {
        if ($variant === null) {
            return null;
        }

        $parts = array_unique(array_filter([
            $variant->model?->make?->name,
            $variant->model?->name,
            $variant->name,
        ], fn ($part) => $part !== null && $part !== ''));

        $label = trim(implode(' ', $parts));

        return $label !== '' ? $label : null;
    }

    /**
     * @param  array{search?: string, tool?: string, status?: string, vehicle?: string, date_from?: string, date_to?: string, user_id?: int|string|null, page?: int, per_page?: int}  $filters
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);
        $search = trim((string) ($filters['search'] ?? ''));
        $tool = trim((string) ($filters['tool'] ?? ''));
        $status = trim((string) ($filters['status'] ?? ''));
        $vehicle = trim((string) ($filters['vehicle'] ?? ''));
        $dateFrom = trim((string) ($filters['date_from'] ?? ''));
        $dateTo = trim((string) ($filters['date_to'] ?? ''));
        $userId = $filters['user_id'] ?? null;

        $sessions = $this->scopedSessions()
            ->with(['user:id,first_name,last_name,email,avatar', 'result'])
            ->when($search !== '', function (Builder $query) use ($search) {
                $needle = '%'.mb_strtolower($search).'%';
                $query->where(function (Builder $query) use ($needle) {
                    $query->whereRaw('LOWER(tool) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(COALESCE(vehicle_key, \'\')) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(COALESCE(scenario_key, \'\')) LIKE ?', [$needle])
                        ->orWhereHas('user', function (Builder $userQuery) use ($needle) {
                            $userQuery->whereRaw('LOWER(first_name) LIKE ?', [$needle])
                                ->orWhereRaw('LOWER(last_name) LIKE ?', [$needle])
                                ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
                        });
                });
            })
            ->when($tool !== '', fn (Builder $query) => $query->where('tool', $tool))
            ->when($status !== '', fn (Builder $query) => $query->where('status', $status))
            ->when($vehicle !== '', function (Builder $query) use ($vehicle) {
                // Breakdown rows are canonical, but legacy rows may still be
                // stored with the lab prefix — match every stored form.
                $normalized = VehicleKey::normalize($vehicle);
                $query->where(function (Builder $query) use ($vehicle, $normalized) {
                    $query->where('vehicle_key', $normalized)
                        ->orWhere('vehicle_key', 'backend:'.$normalized)
                        ->orWhere('vehicle_key', $vehicle);
                });
            })
            ->when($dateFrom !== '', fn (Builder $query) => $query->whereDate('started_at', '>=', $dateFrom))
            ->when($dateTo !== '', fn (Builder $query) => $query->whereDate('started_at', '<=', $dateTo))
            ->when($userId !== null && $userId !== '', fn (Builder $query) => $query->where('user_id', (int) $userId))
            ->orderByDesc('started_at')
            ->paginate($perPage);

        return $sessions->through(fn (SimulatorSession $session) => $this->serializeSession($session));
    }

    public function studentActivity(int $studentId): array
    {
        if ($this->instructorId !== null && ! $this->canViewStudent($studentId)) {
            abort(404, 'Student not found.');
        }

        $sessions = $this->scopedSessions()
            ->where('user_id', $studentId)
            ->with('result')
            ->orderByDesc('started_at')
            ->limit(50)
            ->get();

        $results = $sessions->map->result->filter();

        return [
            'student_id' => $studentId,
            'summary' => [
                'sessions' => $sessions->count(),
                'completed' => $sessions->where('status', 'completed')->count(),
                'results' => $results->count(),
                'average_score' => $results->count() > 0 ? (int) round((float) $results->avg('score')) : 0,
                'pass_rate' => $results->count() > 0
                    ? (int) round(($results->where('outcome', 'pass')->count() / $results->count()) * 100)
                    : 0,
                'average_hints' => $results->count() > 0 ? round((float) $results->avg('hints_used'), 1) : 0.0,
                'average_duration_seconds' => $results->count() > 0 ? (int) round((float) $results->avg('duration_seconds')) : 0,
            ],
            'sessions' => $sessions->map(fn (SimulatorSession $session) => $this->serializeSession($session))->values()->all(),
        ];
    }

    private function scopedSessions(): Builder
    {
        $query = SimulatorSession::query();

        if ($this->instructorId !== null) {
            $query->whereIn('user_id', $this->studentIds());
        }

        return $query;
    }

    private function scopedResults(): Builder
    {
        $query = SimulatorResult::query();

        if ($this->instructorId !== null) {
            $query->whereIn('user_id', $this->studentIds());
        }

        return $query;
    }

    /** @return \Illuminate\Support\Collection<int, int> */
    private function studentIds()
    {
        return User::query()
            ->whereHas('enrollments', function (Builder $query) {
                $query->where('status', '!=', 'cancelled')
                    ->whereHas('course', fn (Builder $course) => $course->where('instructor_id', $this->instructorId));
            })
            ->pluck('id');
    }

    private function canViewStudent(int $studentId): bool
    {
        return User::query()
            ->whereKey($studentId)
            ->whereHas('enrollments', function (Builder $query) {
                $query->where('status', '!=', 'cancelled')
                    ->whereHas('course', fn (Builder $course) => $course->where('instructor_id', $this->instructorId));
            })
            ->exists();
    }

    private function serializeSession(SimulatorSession $session): array
    {
        $user = $session->user;
        $result = $session->result;

        return [
            'id' => $session->id,
            'student' => $user ? [
                'id' => $user->id,
                'name' => $user->full_name,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ] : null,
            'tool' => $session->tool,
            'vehicle_key' => $session->vehicle_key,
            'scenario_key' => $session->scenario_key,
            'status' => $session->status,
            'score' => $session->score,
            'duration_seconds' => $session->duration_seconds,
            'started_at' => $session->started_at?->toISOString(),
            'ended_at' => $session->ended_at?->toISOString(),
            'result' => $result ? [
                'outcome' => $result->outcome,
                'verdict' => $result->verdict,
                'score' => $result->score,
                'attempts' => $result->attempts,
                'hints_used' => $result->hints_used,
                'duration_seconds' => $result->duration_seconds,
                'created_at' => $result->created_at?->toISOString(),
            ] : null,
        ];
    }
}
