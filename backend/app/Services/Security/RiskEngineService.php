<?php

namespace App\Services\Security;

use App\Contracts\Security\RiskRule;
use App\DTOs\Security\RiskAssessment;
use App\DTOs\Security\RiskAssessmentBuilder;
use App\Support\RequestContext;

class RiskEngineService
{
    /**
     * @param iterable<RiskRule> $rules
     */
    public function __construct(
        private iterable $rules,
    ) {}

    public function assess(
        RequestContext $context
    ): RiskAssessment {

        $builder = new RiskAssessmentBuilder();

        foreach ($this->rules as $rule) {

            $rule->apply(
                $builder,
                $context
            );

        }

        return $builder->build();
    }
}