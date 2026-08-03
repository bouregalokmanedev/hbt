<?php

use App\Domains\Courses\Requests\CreateSectionRequest;
use App\Domains\Courses\Requests\ReorderSectionRequest;
use App\Domains\Courses\Requests\UpdateSectionRequest;


it('requires the required create fields', function () {

    $request = new CreateSectionRequest();

    $validator = validator(
        [],
        $request->rules()
    );

    expect($validator->fails())
        ->toBeTrue();

    expect($validator->errors()->has('course_id'))
        ->toBeTrue();

    expect($validator->errors()->has('title'))
        ->toBeTrue();

    expect($validator->errors()->has('slug'))
        ->toBeTrue();

    expect($validator->errors()->has('position'))
        ->toBeTrue();
});


it('rejects an invalid section position', function () {

    $request = new ReorderSectionRequest();

    $validator = validator(
        [
            'position' => 0,
        ],
        $request->rules()
    );

    expect($validator->fails())
        ->toBeTrue();
});


it('accepts a valid reorder position', function () {

    $request = new ReorderSectionRequest();

    $validator = validator(
        [
            'position' => 2,
        ],
        $request->rules()
    );

    expect($validator->passes())
        ->toBeTrue();
});


it('does not allow status through update request', function () {

    $request = new UpdateSectionRequest();

    $rules = $request->rules();

    expect($rules)
        ->not
        ->toHaveKey('status');
});


it('does not allow course reassignment through update request', function () {

    $request = new UpdateSectionRequest();

    $rules = $request->rules();

    expect($rules)
        ->not
        ->toHaveKey('course_id');
});


it('does not allow position changes through update request', function () {

    $request = new UpdateSectionRequest();

    $rules = $request->rules();

    expect($rules)
        ->not
        ->toHaveKey('position');
});