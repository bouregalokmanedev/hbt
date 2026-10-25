<?php

return [
    'gradebook' => [
        'pass_threshold' => (int) env('LMS_GRADE_PASS_THRESHOLD', 70),
        'weights' => [
            'lessons' => (int) env('LMS_GRADE_WEIGHT_LESSONS', 60),
            'assessments' => (int) env('LMS_GRADE_WEIGHT_ASSESSMENTS', 25),
            'practicals' => (int) env('LMS_GRADE_WEIGHT_PRACTICALS', 15),
        ],
    ],
];
