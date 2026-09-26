<?php

namespace App\Domains\Simulator\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StartSimulatorSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'vehicle_key' => [
                'required',
                'string',
                'max:255',
            ],

            'tool' => [
                'required',
                'string',
                Rule::in([
                    'scanner',
                    'multimeter',
                    'oscilloscope',
                    'location',
                    'schematic',
                ]),
            ],

            'scenario_key' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}