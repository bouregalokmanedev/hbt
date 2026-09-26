<?php

namespace App\Domains\Support\Policies;

use App\Domains\Support\Models\SupportTicket;
use App\Enums\UserRole;
use App\Models\User;

final class SupportTicketPolicy
{
    private function isStaff(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::SUPPORT->value,
            UserRole::ADMIN->value,
            UserRole::SUPER_ADMIN->value,
        ]);
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SupportTicket $ticket): bool
    {
        return $ticket->user_id === $user->id || $this->isStaff($user);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function reply(User $user, SupportTicket $ticket): bool
    {
        return $this->view($user, $ticket) && $ticket->status !== \App\Domains\Support\Enums\TicketStatus::CLOSED;
    }

    public function manage(User $user): bool
    {
        return $this->isStaff($user);
    }
}
