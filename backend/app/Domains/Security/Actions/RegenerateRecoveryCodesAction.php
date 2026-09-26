<?php

namespace App\Domains\Security\Actions;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class RegenerateRecoveryCodesAction
{
    /**
     * @return list<string> plain codes (show once)
     */
    public function execute(User $user, int $count = 8): array
    {
        \DB::table('recovery_codes')->where('user_id', $user->id)->delete();

        $plain = [];
        foreach (range(1, $count) as $i) {
            $code = strtoupper(Str::random(4).'-'.Str::random(4));
            $plain[] = $code;
            \DB::table('recovery_codes')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'code_hash' => Hash::make($code),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $plain;
    }

    public function verify(User $user, string $code): bool
    {
        $records = \DB::table('recovery_codes')->where('user_id', $user->id)->whereNull('used_at')->get();
        foreach ($records as $record) {
            if (Hash::check($code, $record->code_hash)) {
                \DB::table('recovery_codes')->where('id', $record->id)->update(['used_at' => now()]);
                return true;
            }
        }
        return false;
    }
}
