<?php

namespace App\Domains\Support\Actions;

use App\Domains\Support\Enums\TicketPriority;
use App\Domains\Support\Enums\TicketStatus;
use App\Domains\Support\Models\SupportTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class CreateTicketAction
{
    public function execute(User $user, array $data): SupportTicket
    {
        return DB::transaction(function () use ($user, $data) {
            $priority = TicketPriority::from($data['priority'] ?? TicketPriority::NORMAL->value);

            $ticket = SupportTicket::create([
                'user_id' => $user->id,
                'subject' => $data['subject'],
                'category' => $data['category'] ?? 'general',
                'priority' => $priority->value,
                'status' => TicketStatus::OPEN->value,
                'due_at' => now()->addHours($priority->slaHours()),
            ]);

            $ticket->replies()->create([
                'user_id' => $user->id,
                'body' => $data['message'],
                'internal' => false,
            ]);

            return $ticket->fresh();
        });
    }
}
