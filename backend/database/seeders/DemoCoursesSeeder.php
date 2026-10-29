<?php

namespace Database\Seeders;

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Three complete, published automotive courses authored by the demo
 * instructor. Every course has categories, sections, lessons and an active
 * enrollment for the demo student so the learner dashboard is not empty.
 *
 * Idempotent: rerunning updates the demo content in place.
 */
final class DemoCoursesSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('Demo courses are disabled in production.');

            return;
        }

        $this->call(DemoAccountsSeeder::class);

        $instructor = User::query()
            ->where('email', 'instructor@hbtronics.test')
            ->firstOrFail();

        $student = User::query()
            ->where('email', 'student@hbtronics.test')
            ->firstOrFail();

        /** @var list<Course> $courses */
        $courses = [];

        foreach ($this->courses() as $payload) {
            $category = Category::updateOrCreate(
                ['slug' => $payload['category']['slug']],
                [
                    'name' => $payload['category']['name'],
                    'description' => $payload['category']['description'],
                    'icon' => $payload['category']['icon'],
                    'color' => $payload['category']['color'],
                    'sort_order' => $payload['category']['sort_order'],
                    'is_active' => true,
                ],
            );

            $duration = collect($payload['sections'])
                ->flatMap(fn (array $section) => $section['lessons'])
                ->sum('duration_minutes');

            $course = Course::updateOrCreate(
                ['slug' => $payload['slug']],
                [
                    'instructor_id' => $instructor->id,
                    'title' => $payload['title'],
                    'short_description' => $payload['short_description'],
                    'description' => $payload['description'],
                    'language' => 'en',
                    'difficulty' => $payload['difficulty'],
                    'duration_minutes' => $duration,
                    'price' => $payload['price'],
                    'discount_price' => null,
                    'currency' => 'DZD',
                    'is_free' => $payload['price'] === 0,
                    'status' => CourseStatus::PUBLISHED,
                    'visibility' => Visibility::PUBLIC,
                    'published_at' => now(),
                    'thumbnail' => null,
                    'cover_image' => null,
                    'preview_video' => null,
                    'meta_title' => $payload['title'].' | HBTronics',
                    'meta_description' => $payload['short_description'],
                ],
            );

            $course->categories()->sync([$category->id]);

            foreach ($payload['sections'] as $sectionPosition => $sectionPayload) {
                $section = $course->sections()->updateOrCreate(
                    ['position' => $sectionPosition + 1],
                    [
                        'title' => $sectionPayload['title'],
                        'slug' => $sectionPayload['slug'],
                        'description' => $sectionPayload['description'],
                        'status' => SectionStatus::PUBLISHED,
                    ],
                );

                foreach ($sectionPayload['lessons'] as $lessonPosition => $lessonPayload) {
                    $section->lessons()->updateOrCreate(
                        ['position' => $lessonPosition + 1],
                        [
                            'title' => $lessonPayload['title'],
                            'slug' => $lessonPayload['slug'],
                            'description' => $lessonPayload['description'],
                            'content' => $lessonPayload['content'],
                            'duration_minutes' => $lessonPayload['duration_minutes'],
                            'is_preview' => $lessonPayload['is_preview'] ?? false,
                            'status' => LessonStatus::PUBLISHED,
                        ],
                    );
                }
            }

            Enrollment::updateOrCreate(
                [
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                ],
                [
                    'status' => EnrollmentStatus::ACTIVE,
                    'enrolled_at' => now(),
                    'completed_at' => null,
                    'cancelled_at' => null,
                ],
            );

            $courses[] = $course;
        }

        // Give the student visible momentum in the opening section.
        $firstSection = $courses[0]->sections()
            ->orderBy('position')
            ->first();

        foreach ($firstSection?->lessons()->orderBy('position')->take(2)->get() ?? [] as $lesson) {
            $this->completeLesson($student, $lesson);
        }

        $this->command?->info('Seeded three published demo courses and enrolled the demo student.');
    }

    private function completeLesson(User $student, Lesson $lesson): void
    {
        LessonProgress::updateOrCreate(
            [
                'user_id' => $student->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'started_at' => now()->subDays(2),
                'progress_percentage' => 100,
                'time_spent' => $lesson->duration_minutes * 60,
                'completed_at' => now()->subDay(),
            ],
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function courses(): array
    {
        return [
            [
                'title' => 'Automotive Electrical Foundations',
                'slug' => 'automotive-electrical-foundations',
                'short_description' => 'Read wiring diagrams, measure circuits and diagnose battery, starting and charging faults with confidence.',
                'description' => 'A practical foundation in automotive electrical diagnosis. You will learn how to use a multimeter and oscilloscope safely, perform voltage-drop and parasitic-drain tests, and work through battery, starter and charging-system faults on training vehicles. The course finishes with a guided no-crank case study that mirrors a real workshop workflow.',
                'difficulty' => Difficulty::BEGINNER,
                'price' => 0,
                'category' => [
                    'name' => 'Electrical & Electronics',
                    'slug' => 'electrical-electronics',
                    'description' => 'Electrical measurement, batteries, starting, charging and body electronics.',
                    'icon' => 'Zap',
                    'color' => '#F47822',
                    'sort_order' => 10,
                ],
                'sections' => [
                    [
                        'title' => 'Electrical measurement essentials',
                        'slug' => 'electrical-measurement-essentials',
                        'description' => 'Build safe, repeatable measurement habits before touching a fault.',
                        'lessons' => [
                            [
                                'title' => 'Multimeters, scopes and safe probing',
                                'slug' => 'multimeters-scopes-safe-probing',
                                'description' => 'Choose the right tool and make a measurement without damaging the circuit.',
                                'content' => 'In this lesson you will set up a multimeter and an oscilloscope, select the correct range, and practise safe back-probing at connectors. We cover CAT ratings, fuse protection and the difference between measuring voltage and measuring resistance.',
                                'duration_minutes' => 45,
                                'is_preview' => true,
                            ],
                            [
                                'title' => 'Voltage-drop testing',
                                'slug' => 'voltage-drop-testing',
                                'description' => 'Find hidden resistance in cables, grounds and connectors.',
                                'content' => 'Loaded voltage-drop testing is the fastest way to prove a cable or ground fault. You will measure the drop across fuses, relays, splices and chassis grounds, then compare your readings with the manufacturer specification.',
                                'duration_minutes' => 60,
                            ],
                            [
                                'title' => 'Series, parallel and ground circuits',
                                'slug' => 'series-parallel-ground-circuits',
                                'description' => 'Predict current flow and recognise a shared-ground fault.',
                                'content' => 'We map series, parallel and series-parallel circuits on the bench, calculate expected current and use the results to explain why one faulty ground can affect several unrelated systems.',
                                'duration_minutes' => 50,
                            ],
                        ],
                    ],
                    [
                        'title' => 'Battery, starting and charging',
                        'slug' => 'battery-starting-charging',
                        'description' => 'Diagnose the three systems that keep every vehicle on the road.',
                        'lessons' => [
                            [
                                'title' => 'Battery testing and diagnosis',
                                'slug' => 'battery-testing-diagnosis',
                                'description' => 'Separate a weak battery from a charging or drain problem.',
                                'content' => 'You will perform state-of-charge and state-of-health tests, interpret conductance results and use a repair-order checklist to decide whether the battery, the charging system or a parasitic load is responsible.',
                                'duration_minutes' => 55,
                            ],
                            [
                                'title' => 'Starter circuit faults',
                                'slug' => 'starter-circuit-faults',
                                'description' => 'Trace no-crank and slow-crank complaints logically.',
                                'content' => 'Starting with the battery and ground path, we work through the ignition switch, starter relay, immobiliser inhibit and starter solenoid. You will measure current draw and voltage drop under load to locate a high-resistance joint.',
                                'duration_minutes' => 60,
                            ],
                            [
                                'title' => 'Charging system and alternator control',
                                'slug' => 'charging-system-alternator-control',
                                'description' => 'Test regulated charging on smart and conventional alternators.',
                                'content' => 'This lesson covers alternator output, ripple, sense wires and LIN-controlled charging. You will compare command and actual charging voltage, then diagnose an overcharge and an undercharge case.',
                                'duration_minutes' => 65,
                            ],
                        ],
                    ],
                    [
                        'title' => 'Guided diagnostic case',
                        'slug' => 'guided-diagnostic-case',
                        'description' => 'Bring the measurement and system knowledge together.',
                        'lessons' => [
                            [
                                'title' => 'No-crank, slow-crank case study',
                                'slug' => 'no-crank-slow-crank-case-study',
                                'description' => 'Work a complete complaint from interview to repair verification.',
                                'content' => 'A customer reports a slow crank that becomes a no-crank after a cold night. You will follow the diagnostic sequence, record each measurement, identify the failed component and verify the repair with a voltage-drop retest.',
                                'duration_minutes' => 45,
                            ],
                            [
                                'title' => 'Parasitic drain measurement',
                                'slug' => 'parasitic-drain-measurement',
                                'description' => 'Measure sleep current without waking the vehicle.',
                                'content' => 'We set up an inductive current clamp, wait for all modules to sleep, and isolate a parasitic drain with a fuse-voltage or current-clamp method. You will document the baseline and prove the repair.',
                                'duration_minutes' => 40,
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'CAN Bus & Network Diagnostics',
                'slug' => 'can-bus-network-diagnostics',
                'short_description' => 'Decode CAN traffic, isolate wiring and module faults, and repair modern vehicle networks with dealer-level confidence.',
                'description' => 'A hands-on intermediate programme for technicians who already diagnose electrical faults and want to master in-vehicle networks. Starting from differential signalling and topology, you will capture CAN frames on an oscilloscope, interpret network faults, and work through bus-off, gateway and termination failures. The final workshop injects reproducible network faults on a live vehicle and asks you to prove the repair with a written diagnostic report.',
                'difficulty' => Difficulty::INTERMEDIATE,
                'price' => 18500,
                'category' => [
                    'name' => 'Vehicle Networks',
                    'slug' => 'vehicle-networks',
                    'description' => 'CAN, LIN, FlexRay, gateways and module communication faults.',
                    'icon' => 'Network',
                    'color' => '#2F80ED',
                    'sort_order' => 20,
                ],
                'sections' => [
                    [
                        'title' => 'Network fundamentals',
                        'slug' => 'network-fundamentals',
                        'description' => 'Understand what a healthy bus looks like before diagnosing a fault.',
                        'lessons' => [
                            [
                                'title' => 'CAN high/low and differential signalling',
                                'slug' => 'can-high-low-differential-signalling',
                                'description' => 'Read the physical layer and recognise a distorted frame.',
                                'content' => 'We explain dominant and recessive bits, differential voltage and common-mode noise. You will capture CAN high and low together on a two-channel scope and identify a short to ground, a short to power and a missing termination resistor.',
                                'duration_minutes' => 50,
                                'is_preview' => true,
                            ],
                            [
                                'title' => 'Topology, gateways and termination',
                                'slug' => 'topology-gateways-termination',
                                'description' => 'Map the network and know which module owns each segment.',
                                'content' => 'Using wiring diagrams, you will map the powertrain, chassis and comfort buses, locate the gateway and measure termination on each segment. The lesson shows why a fault on one segment can set communication codes across the vehicle.',
                                'duration_minutes' => 55,
                            ],
                            [
                                'title' => 'Oscilloscope capture of CAN frames',
                                'slug' => 'oscilloscope-capture-can-frames',
                                'description' => 'Capture, decode and save a repeatable network trace.',
                                'content' => 'You will set timebase, trigger and decoding options for a CAN trace, then save a baseline capture. We compare a clean frame with a frame corrupted by an intermittent connector and discuss when to use a scope instead of a scan tool.',
                                'duration_minutes' => 60,
                            ],
                        ],
                    ],
                    [
                        'title' => 'Fault isolation',
                        'slug' => 'fault-isolation',
                        'description' => 'Move from communication codes to the physical fault.',
                        'lessons' => [
                            [
                                'title' => 'Bus-off and intermittent communication',
                                'slug' => 'bus-off-intermittent-communication',
                                'description' => 'Find the module or wire taking the bus offline.',
                                'content' => 'We interpret error counters, bus-off states and U-codes, then isolate the culprit by segment and by module. You will learn a safe disconnect sequence and how to avoid disturbing the fault while testing.',
                                'duration_minutes' => 65,
                            ],
                            [
                                'title' => 'Wiring, connector and ground faults',
                                'slug' => 'wiring-connector-ground-faults',
                                'description' => 'Prove resistance faults without guessing.',
                                'content' => 'This lesson covers twisted-pair repair, terminal tension, shield and ground integrity, and the effect of water ingress. You will perform a loaded resistance test on a suspect segment and document the result.',
                                'duration_minutes' => 60,
                            ],
                            [
                                'title' => 'Module power modes and wake-up faults',
                                'slug' => 'module-power-modes-wake-up-faults',
                                'description' => 'Diagnose a network that stays awake or refuses to wake.',
                                'content' => 'You will measure wake-up lines, ignition inputs and sleep current, distinguish a module that will not sleep from one that cannot wake, and use a scan tool to confirm network activity after each intervention.',
                                'duration_minutes' => 55,
                            ],
                        ],
                    ],
                    [
                        'title' => 'Live vehicle workshop',
                        'slug' => 'live-vehicle-workshop',
                        'description' => 'Apply the method to injected faults and prove the repair.',
                        'lessons' => [
                            [
                                'title' => 'Injected CAN fault challenge',
                                'slug' => 'injected-can-fault-challenge',
                                'description' => 'Diagnose a fault you have never seen before.',
                                'content' => 'Your instructor injects one of several network faults without telling you which. You will interview the driver, capture the symptoms, choose your measurements and isolate the fault using the same method taught in the course.',
                                'duration_minutes' => 70,
                            ],
                            [
                                'title' => 'Repair verification and report writing',
                                'slug' => 'repair-verification-report-writing',
                                'description' => 'Close the job with evidence, not assumptions.',
                                'content' => 'After the repair, you will repeat the baseline capture, clear and recheck codes, and write a concise diagnostic report with the complaint, measurements, root cause and verification. This is the document a workshop needs when the vehicle returns.',
                                'duration_minutes' => 65,
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'EV & Hybrid High-Voltage Safety',
                'slug' => 'ev-hybrid-high-voltage-safety',
                'short_description' => 'Work safely around high-voltage systems, diagnose battery and inverter faults, and complete a practical HV shutdown assessment.',
                'description' => 'An advanced safety and diagnostic programme for technicians moving into electric and hybrid vehicles. You will learn high-voltage architecture and hazards, correct PPE and isolation procedure, CAT III measurement, battery-management live data, inverter and motor faults, and charging interlocks. The course ends with a live high-voltage shutdown exercise and a practical assessment with a full debrief.',
                'difficulty' => Difficulty::ADVANCED,
                'price' => 24000,
                'category' => [
                    'name' => 'Electrification & HV',
                    'slug' => 'electrification-hv',
                    'description' => 'High-voltage safety, batteries, inverters, motors and charging systems.',
                    'icon' => 'BatteryCharging',
                    'color' => '#27AE60',
                    'sort_order' => 30,
                ],
                'sections' => [
                    [
                        'title' => 'HV safety and isolation',
                        'slug' => 'hv-safety-isolation',
                        'description' => 'Build the habits that keep you safe before any HV work begins.',
                        'lessons' => [
                            [
                                'title' => 'HV system architecture and hazards',
                                'slug' => 'hv-system-architecture-hazards',
                                'description' => 'Identify the HV components and the paths that can energise them.',
                                'content' => 'We map the battery pack, service disconnect, inverter, motor, charger and HV cables. You will learn the difference between AC and DC hazards, how isolation monitoring works, and which components remain live after shutdown.',
                                'duration_minutes' => 60,
                                'is_preview' => true,
                            ],
                            [
                                'title' => 'PPE, lockout and rescue procedures',
                                'slug' => 'ppe-lockout-rescue-procedures',
                                'description' => 'Prepare the bay, the tools and the team before work starts.',
                                'content' => 'This lesson covers class-0 gloves, face protection, insulated tools, barriers and the lockout/tagout sequence. We walk through a rescue plan and the first actions after an HV exposure incident.',
                                'duration_minutes' => 70,
                            ],
                            [
                                'title' => 'CAT III measurement on HV systems',
                                'slug' => 'cat-iii-measurement-hv-systems',
                                'description' => 'Verify isolation with the right meter and the right method.',
                                'content' => 'You will select a CAT III rated meter, prove the meter on a known live source, measure isolation voltage and confirm the absence of voltage before touching a component. We discuss meter failure modes and why proving the tester matters.',
                                'duration_minutes' => 65,
                            ],
                        ],
                    ],
                    [
                        'title' => 'Battery and powertrain diagnosis',
                        'slug' => 'battery-powertrain-diagnosis',
                        'description' => 'Use live data and safe measurements to find HV faults.',
                        'lessons' => [
                            [
                                'title' => 'Battery management systems and live data',
                                'slug' => 'battery-management-systems-live-data',
                                'description' => 'Read cell voltages, temperatures and balancing status.',
                                'content' => 'We interpret BMS live data, compare cell groups, identify a weak module and explain how balancing and thermal management affect range. You will learn when a pack needs service and when a software update is the correct repair.',
                                'duration_minutes' => 70,
                            ],
                            [
                                'title' => 'Inverter, motor and generator faults',
                                'slug' => 'inverter-motor-generator-faults',
                                'description' => 'Diagnose drive-unit symptoms without opening the HV pack.',
                                'content' => 'This lesson covers inverter insulation faults, motor position sensors, phase resistance and generator charging. You will use scan data plus safe isolation measurements to separate a drive-unit fault from a harness or control fault.',
                                'duration_minutes' => 65,
                            ],
                            [
                                'title' => 'Charging and interlock faults',
                                'slug' => 'charging-interlock-faults',
                                'description' => 'Trace why a vehicle will not charge or will not start.',
                                'content' => 'You will follow the charging handshake, inspect the charge port and interlock circuit, and diagnose a vehicle that refuses to enter READY. The lesson includes AC and DC charging cases and the safety checks required before testing the port.',
                                'duration_minutes' => 60,
                            ],
                        ],
                    ],
                    [
                        'title' => 'High-voltage capstone',
                        'slug' => 'high-voltage-capstone',
                        'description' => 'Complete a shutdown and diagnostic exercise under supervision.',
                        'lessons' => [
                            [
                                'title' => 'High-voltage shutdown case study',
                                'slug' => 'high-voltage-shutdown-case-study',
                                'description' => 'Perform a full isolation sequence on a live training vehicle.',
                                'content' => 'Working in pairs, you will prepare the vehicle, isolate the HV system, prove the absence of voltage, remove the service disconnect and document every step. Your instructor signs off each stage before you proceed.',
                                'duration_minutes' => 75,
                            ],
                            [
                                'title' => 'Practical assessment and debrief',
                                'slug' => 'practical-assessment-debrief',
                                'description' => 'Demonstrate safe practice and diagnostic reasoning.',
                                'content' => 'The final assessment combines a practical isolation check with a fault-diagnosis interview. You will explain your measurements, justify each safety decision and receive a written debrief with the next steps for your workshop.',
                                'duration_minutes' => 75,
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}
