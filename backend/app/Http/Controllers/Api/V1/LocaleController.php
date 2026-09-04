<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class LocaleController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'locale' => ['required', 'string', Rule::in(['en', 'ar', 'fr'])],
        ]);

        $request->user()->update(['language' => $data['locale']]);

        return response()->json(['data' => ['locale' => $data['locale']]]);
    }
}
