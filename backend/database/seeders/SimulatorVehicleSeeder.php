<?php

namespace Database\Seeders;

use App\Models\VehicleMake;
use App\Models\VehicleModel;
use App\Models\VehicleVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds the simulator garage vehicles (mirrors the static lab dataset) into
 * the vehicle catalogue so they appear in the instructor builder and the
 * student catalogue. Idempotent — safe to re-run.
 */
class SimulatorVehicleSeeder extends Seeder
{
    /**
     * @var array<int, array{make: string, country: string|null, models: array<int, array{name: string, variants: array<int, array<string, mixed>>}>}>
     */
    private array $catalog = [
        [
            'make' => 'Toyota',
            'country' => 'JP',
            'models' => [
                [
                    'name' => 'Corolla',
                    'variants' => [
                        [
                            'name' => '1.6 16V VVT-i', 'engine_code' => '1ZR-FE', 'transmission' => '6 MT',
                            'year_from' => 2013, 'year_to' => 2018,
                            'vin' => 'JTNBV58E90J123456', 'odometer_km' => 98420, 'installed' => true,
                            'coverage' => ['scanner' => 'ok', 'multimeter' => 'ok', 'oscilloscope' => 'ok', 'location' => 'ok', 'schematic' => 'ok'],
                        ],
                    ],
                ],
                [
                    'name' => 'Camry',
                    'variants' => [
                        [
                            'name' => '2.5 Dynamic Force', 'engine_code' => 'A25A-FKS', 'transmission' => '8 AT',
                            'year_from' => 2018, 'year_to' => 2023,
                            'vin' => '4T1BZ1FB7LU012345', 'odometer_km' => 42110, 'installed' => false,
                            'coverage' => ['scanner' => 'avail', 'multimeter' => 'avail', 'oscilloscope' => 'avail', 'location' => 'avail', 'schematic' => 'avail'],
                        ],
                    ],
                ],
            ],
        ],
        [
            'make' => 'Volkswagen',
            'country' => 'DE',
            'models' => [
                [
                    'name' => 'Golf',
                    'variants' => [
                        [
                            'name' => '1.6 TDI', 'engine_code' => 'CZCA', 'transmission' => '5 MT',
                            'year_from' => 2012, 'year_to' => 2019,
                            'vin' => 'WVWZZZ1KZAW000111', 'odometer_km' => 176500, 'installed' => false,
                            'coverage' => ['scanner' => 'ok', 'multimeter' => 'avail', 'oscilloscope' => 'none', 'location' => 'avail', 'schematic' => 'none'],
                        ],
                    ],
                ],
            ],
        ],
        [
            'make' => 'Hyundai',
            'country' => 'KR',
            'models' => [
                [
                    'name' => 'i30',
                    'variants' => [
                        [
                            'name' => '1.6 CRDi', 'engine_code' => 'D4FB', 'transmission' => '6 MT',
                            'year_from' => 2011, 'year_to' => 2017,
                            'vin' => 'TMAD381CAFJ099887', 'odometer_km' => 121300, 'installed' => false,
                            'coverage' => ['scanner' => 'none', 'multimeter' => 'none', 'oscilloscope' => 'none', 'location' => 'none', 'schematic' => 'none'],
                        ],
                    ],
                ],
            ],
        ],
    ];

    public function run(): void
    {
        foreach ($this->catalog as $makeData) {
            $make = VehicleMake::query()->firstOrCreate(
                ['slug' => Str::slug($makeData['make'])],
                ['name' => $makeData['make'], 'country' => $makeData['country']],
            );
            foreach ($makeData['models'] as $modelData) {
                $model = VehicleModel::query()->firstOrCreate(
                    ['make_id' => $make->id, 'slug' => Str::slug($modelData['name'])],
                    ['name' => $modelData['name']],
                );
                foreach ($modelData['variants'] as $variantData) {
                    VehicleVariant::query()->updateOrCreate(
                        [
                            'model_id' => $model->id,
                            'engine_code' => $variantData['engine_code'],
                        ],
                        [
                            'name' => $variantData['name'],
                            'fuel_type' => null,
                            'transmission' => $variantData['transmission'],
                            'year_from' => $variantData['year_from'],
                            'year_to' => $variantData['year_to'],
                            'metadata' => [
                                'seeded' => true,
                                'installed' => $variantData['installed'],
                                'vin' => $variantData['vin'],
                                'odometer_km' => $variantData['odometer_km'],
                                'coverage' => $variantData['coverage'],
                            ],
                        ],
                    );
                }
            }
        }
    }
}
