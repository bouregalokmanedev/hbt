<?php

namespace App\Services\Security\Rules;

use App\Contracts\Security\RiskRule;
use App\DTOs\Security\RiskAssessmentBuilder;
use App\Support\RequestContext;

class BotRiskRule implements RiskRule
{
    public function apply(
        RiskAssessmentBuilder $builder,
        RequestContext $context
    ): void {

        if ($context->device->isBot) {

            $builder->add(
                100,
                'Bot detected'
            );

        }

    }
}