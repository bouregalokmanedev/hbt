<?php

namespace App\Contracts\Security;

use App\DTOs\Security\RiskAssessmentBuilder;
use App\Support\RequestContext;

interface RiskRule
{
    public function apply(
        RiskAssessmentBuilder $builder,
        RequestContext $context
    ): void;
}