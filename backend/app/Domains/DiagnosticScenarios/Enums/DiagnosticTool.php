<?php

namespace App\Domains\DiagnosticScenarios\Enums;

enum DiagnosticTool: string
{
    case SCANNER = 'scanner';
    case MULTIMETER = 'multimeter';
    case OSCILLOSCOPE = 'oscilloscope';
    case LOCATION = 'location';
    case SCHEMATIC = 'schematic';
}
