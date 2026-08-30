<?php

namespace App\Domains\DiagnosticScenarios\Enums;

enum DiagnosticScenarioStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';
}