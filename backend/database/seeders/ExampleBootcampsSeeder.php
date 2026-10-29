<?php

namespace Database\Seeders;

use App\Enums\Bootcamps\BootcampPaymentMethod;
use App\Enums\Bootcamps\BootcampRegistrationStatus;
use App\Enums\Bootcamps\BootcampSite;
use App\Enums\Bootcamps\BootcampStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\UserStatus;
use App\Models\Bootcamp;
use App\Models\BootcampRegistration;
use App\Models\BootcampSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

/**
 * Two complete, published bootcamps for local demos and the public catalog.
 *
 * Idempotent: re-running only fills in bootcamps that are missing. The demo
 * instructor is the same account used by ExampleCourseSeeder (password:
 * "password"), so one login can show both authored courses and bootcamps.
 */
final class ExampleBootcampsSeeder extends Seeder
{
    private const SAMPLE_PDF = <<<'PDF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 116 >>
stream
BT /F1 20 Tf 72 720 Td (HBTronics Bootcamp Brochure) Tj 0 -32 Td /F1 11 Tf (Full curriculum, schedule and admissions information.) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
trailer
<< /Root 1 0 R /Size 6 >>
%%EOF
PDF;

    public function run(): void
    {
        Role::findOrCreate('Instructor', 'web');

        $instructor = User::firstOrCreate(
            ['email' => 'maya.instructor@example.com'],
            [
                'first_name' => 'Maya',
                'last_name' => 'Instructor',
                'username' => 'maya.instructor',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => UserStatus::ACTIVE->value,
            ],
        );

        // Existing demo databases may have created Maya before activation was
        // part of the seeder; keep her able to sign in and manage bootcamps.
        $instructor->forceFill([
            'status' => UserStatus::ACTIVE->value,
            'email_verified_at' => $instructor->email_verified_at ?? now(),
        ])->save();

        $instructor->assignRole('Instructor');

        $this->seedEvHybridBootcamp($instructor);
        $this->seedEcuBootcamp($instructor);

        $this->command?->info('Seeded example bootcamps for maya.instructor@example.com.');
    }

    private function seedEvHybridBootcamp(User $instructor): void
    {
        if ($existing = Bootcamp::withTrashed()->where('slug', 'ev-hybrid-diagnostics-bootcamp')->first()) {
            $this->refreshDemoAssets(
                $existing,
                'EV & Hybrid Diagnostics',
                '#F47822',
                'High-voltage safety · Battery systems · Live vehicles'
            );

            return;
        }

        $bootcamp = Bootcamp::create([
            'instructor_id' => $instructor->id,
            'title' => 'EV & Hybrid Diagnostics Bootcamp',
            'slug' => 'ev-hybrid-diagnostics-bootcamp',
            'short_description' => 'Diagnose high-voltage hybrids safely, from battery architecture to live road tests.',
            'description' => 'A four-week, workshop-led bootcamp for technicians who want to service electric and hybrid vehicles with confidence. You will work through high-voltage safety, battery management systems, inverter and motor diagnostics, charging faults and live vehicle case studies. Every week combines classroom demonstrations with guided measurements on training vehicles and a final diagnostic capstone.',
            'duration_value' => 4,
            'duration_unit' => 'weeks',
            'location' => 'Algiers Campus',
            'price' => 89000,
            'currency' => 'DZD',
            'level' => Difficulty::INTERMEDIATE,
            'includes' => [
                'challenges' => true,
                'resources' => true,
                'quizzes' => true,
                'support' => true,
                'certificate' => true,
                'final_project' => true,
                'classrooms' => true,
            ],
            'status' => BootcampStatus::PUBLISHED,
            'published_at' => now()->subDays(12),
            'brochure_original_name' => 'EV-Hybrid-Diagnostics-Bootcamp.pdf',
        ]);

        $this->brochure($bootcamp, 'ev-hybrid-diagnostics-bootcamp.pdf');
        $this->coverArtwork(
            $bootcamp,
            'EV & Hybrid Diagnostics',
            '#F47822',
            'High-voltage safety · Battery systems · Live vehicles'
        );

        $firstSession = $this->schedule($bootcamp, 14, 42);
        $this->schedule($bootcamp, 63, 91);

        $this->curriculum($bootcamp, [
            'High-voltage safety & tooling' => [
                ['HV safety protocols and isolation', 3, 90],
                ['PPE, lockout and rescue procedures', 2, 60],
                ['Insulation and CAT III measurement practice', 4, 120],
            ],
            'Hybrid powertrain architecture' => [
                ['Series, parallel and power-split layouts', 3, 90],
                ['Inverter, motor and generator operation', 4, 120],
                ['Regenerative braking and energy flow', 3, 75],
            ],
            'Battery management systems' => [
                ['Cell chemistry, modules and packs', 4, 100],
                ['BMS live data and balancing faults', 5, 150],
                ['Thermal management diagnosis', 3, 90],
            ],
            'Live vehicle diagnostics' => [
                ['No-start and interlock faults', 4, 120],
                ['Charging system and onboard charger faults', 4, 120],
                ['Road-test data capture and analysis', 3, 90],
            ],
            'Diagnostic capstone' => [
                ['Case study: intermittent HV shutdown', 4, 150],
                ['Final practical assessment and debrief', 3, 120],
            ],
        ]);

        $this->registrations($bootcamp, $firstSession, [
            ['Nadia', 'Benali', 'nadia.benali@example.com', '+213 555 120 330', BootcampSite::ALGIERS_HYDRA, BootcampPaymentMethod::CASH, BootcampRegistrationStatus::CONFIRMED],
            ['Yacine', 'Mansouri', 'yacine.mansouri@example.com', '+213 555 440 218', BootcampSite::ALGIERS_HYDRA, BootcampPaymentMethod::BANK_TRANSFER, BootcampRegistrationStatus::PENDING],
            ['Sara', 'Haddad', 'sara.haddad@example.com', '+213 555 903 771', BootcampSite::ONLINE, BootcampPaymentMethod::VISA_CARD, BootcampRegistrationStatus::PENDING],
        ]);
    }

    private function seedEcuBootcamp(User $instructor): void
    {
        if ($existing = Bootcamp::withTrashed()->where('slug', 'advanced-ecu-can-bus-mastery')->first()) {
            $this->refreshDemoAssets(
                $existing,
                'Advanced ECU & CAN Bus',
                '#2F80ED',
                'Network topology · Oscilloscope signals · ECU coding'
            );

            return;
        }

        $bootcamp = Bootcamp::create([
            'instructor_id' => $instructor->id,
            'title' => 'Advanced ECU & CAN Bus Mastery',
            'slug' => 'advanced-ecu-can-bus-mastery',
            'short_description' => 'Read, scope and repair modern vehicle networks with dealer-level confidence.',
            'description' => 'A ten-day advanced programme for working diagnosticians. Starting from network topology and oscilloscope fundamentals, you will decode CAN, LIN and FlexRay traffic, isolate termination and wiring faults, and work with ECU coding and adaptation workflows. The final two days are dedicated to reproducible network faults on live vehicles and a written diagnostic report.',
            'duration_value' => 10,
            'duration_unit' => 'days',
            'location' => 'Algiers Campus',
            'price' => 119000,
            'currency' => 'DZD',
            'level' => Difficulty::ADVANCED,
            'includes' => [
                'challenges' => true,
                'resources' => true,
                'quizzes' => true,
                'support' => true,
                'certificate' => true,
                'final_project' => true,
                'classrooms' => true,
            ],
            'status' => BootcampStatus::PUBLISHED,
            'published_at' => now()->subDays(5),
            'brochure_original_name' => 'Advanced-ECU-CAN-Bus-Mastery.pdf',
        ]);

        $this->brochure($bootcamp, 'advanced-ecu-can-bus-mastery.pdf');
        $this->coverArtwork(
            $bootcamp,
            'Advanced ECU & CAN Bus',
            '#2F80ED',
            'Network topology · Oscilloscope signals · ECU coding'
        );

        $firstSession = $this->schedule($bootcamp, 21, 31);
        $this->schedule($bootcamp, 70, 80);

        $this->curriculum($bootcamp, [
            'Network topology & measurement' => [
                ['CAN High/CAN Low fundamentals', 3, 90],
                ['Oscilloscope setup and differential probing', 4, 120],
                ['Topology maps and termination resistance', 3, 75],
            ],
            'Protocol decoding' => [
                ['CAN frames, arbitration and error states', 4, 120],
                ['LIN scheduling and sleep behaviour', 3, 90],
                ['FlexRay and gateway routing', 3, 90],
            ],
            'ECU communication faults' => [
                ['Bus-off and intermittent no-communication', 4, 120],
                ['Wiring harness and connector diagnostics', 4, 120],
                ['Gateway and power-mode faults', 3, 90],
            ],
            'Coding, adaptation & security' => [
                ['ECU replacement and coding workflow', 4, 120],
                ['Immobiliser and component protection', 3, 90],
                ['Diagnostic report writing', 2, 60],
            ],
            'Live network capstone' => [
                ['Injected CAN fault challenge', 4, 150],
                ['Final assessment and technical debrief', 3, 120],
            ],
        ]);

        $this->registrations($bootcamp, $firstSession, [
            ['Karim', 'Boudiaf', 'karim.boudiaf@example.com', '+213 555 771 904', BootcampSite::ALGIERS_CENTRE, BootcampPaymentMethod::CASH, BootcampRegistrationStatus::CONFIRMED],
            ['Imane', 'Cherif', 'imane.cherif@example.com', '+213 555 338 220', BootcampSite::ONLINE, BootcampPaymentMethod::BANK_TRANSFER, BootcampRegistrationStatus::PENDING],
        ]);
    }

    private function schedule(Bootcamp $bootcamp, int $startInDays, int $endInDays): BootcampSchedule
    {
        return $bootcamp->schedules()->create([
            'starts_at' => today()->addDays($startInDays)->toDateString(),
            'ends_at' => today()->addDays($endInDays)->toDateString(),
        ]);
    }

    /**
     * @param  array<string, array<int, array{0: string, 1: int, 2: int}>>  $sections
     */
    private function curriculum(Bootcamp $bootcamp, array $sections): void
    {
        $sectionPosition = 1;

        foreach ($sections as $title => $lessons) {
            $section = $bootcamp->sections()->create([
                'title' => $title,
                'position' => $sectionPosition++,
            ]);

            $lessonPosition = 1;

            foreach ($lessons as [$lessonTitle, $classrooms, $duration]) {
                $section->lessons()->create([
                    'title' => $lessonTitle,
                    'classroom_count' => $classrooms,
                    'duration_minutes' => $duration,
                    'position' => $lessonPosition++,
                ]);
            }
        }
    }

    /**
     * @param  array<int, array{0: string, 1: string, 2: string, 3: string, 4: BootcampSite, 5: BootcampPaymentMethod, 6: BootcampRegistrationStatus}>  $registrations
     */
    private function registrations(
        Bootcamp $bootcamp,
        BootcampSchedule $schedule,
        array $registrations,
    ): void {
        foreach ($registrations as [$first, $last, $email, $phone, $site, $method, $status]) {
            BootcampRegistration::create([
                'bootcamp_id' => $bootcamp->id,
                'bootcamp_schedule_id' => $schedule->id,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'phone' => $phone,
                'site' => $site,
                'payment_method' => $method,
                'terms_accepted' => true,
                'status' => $status,
            ]);
        }
    }

    private function brochure(Bootcamp $bootcamp, string $filename): void
    {
        $path = 'bootcamp-brochures/'.$filename;

        Storage::disk('local')->put($path, self::SAMPLE_PDF);

        $bootcamp->update(['brochure_path' => $path]);
    }

    /**
     * Existing demo databases created before media and the expanded package
     * existed should still show the current public experience. This only
     * fills missing values so instructor edits are preserved.
     */
    private function refreshDemoAssets(
        Bootcamp $bootcamp,
        string $title,
        string $accent,
        string $subtitle,
    ): void {
        if ($bootcamp->trashed()) {
            return;
        }

        $includes = is_array($bootcamp->includes) ? $bootcamp->includes : [];
        $includes['final_project'] ??= true;
        $includes['classrooms'] ??= true;
        $bootcamp->update(['includes' => $includes]);

        if (blank($bootcamp->thumbnail) && blank($bootcamp->cover_image)) {
            $this->coverArtwork($bootcamp, $title, $accent, $subtitle);
        }
    }

    /**
     * Store a branded demo cover so a fresh install still shows the uploaded
     * media experience before an instructor replaces it from the editor.
     */
    private function coverArtwork(
        Bootcamp $bootcamp,
        string $title,
        string $accent,
        string $subtitle,
    ): void {
        $safeTitle = htmlspecialchars(
            $title,
            ENT_QUOTES | ENT_XML1
        );
        $safeSubtitle = htmlspecialchars(
            $subtitle,
            ENT_QUOTES | ENT_XML1
        );

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
    <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#242428"/>
            <stop offset="0.55" stop-color="#303036"/>
            <stop offset="1" stop-color="#18181b"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.82" cy="0.18" r="0.72">
            <stop offset="0" stop-color="{$accent}" stop-opacity="0.58"/>
            <stop offset="1" stop-color="{$accent}" stop-opacity="0"/>
        </radialGradient>
        <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#ffffff" stroke-opacity="0.055" stroke-width="1"/>
        </pattern>
    </defs>
    <rect width="1600" height="900" fill="url(#bg)"/>
    <rect width="1600" height="900" fill="url(#glow)"/>
    <rect width="1600" height="900" fill="url(#grid)"/>
    <circle cx="1330" cy="190" r="260" fill="none" stroke="{$accent}" stroke-opacity="0.22" stroke-width="2"/>
    <circle cx="1330" cy="190" r="190" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2"/>
    <text x="96" y="150" fill="{$accent}" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="8">HBTRONICS · BOOTCAMP</text>
    <text x="96" y="350" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="700">{$safeTitle}</text>
    <text x="96" y="424" fill="#ffffff" fill-opacity="0.58" font-family="Arial, Helvetica, sans-serif" font-size="30">{$safeSubtitle}</text>
    <rect x="96" y="500" width="148" height="6" rx="3" fill="{$accent}"/>
    <text x="96" y="570" fill="#ffffff" fill-opacity="0.42" font-family="Arial, Helvetica, sans-serif" font-size="24" letter-spacing="2">DIAGNOSE · PRACTISE · CERTIFY</text>
</svg>
SVG;

        $directory = "bootcamps/{$bootcamp->id}";

        Storage::disk('public')->put("{$directory}/cover.svg", $svg);
        Storage::disk('public')->put("{$directory}/thumbnail.svg", $svg);

        $bootcamp->update([
            'cover_image' => "{$directory}/cover.svg",
            'thumbnail' => "{$directory}/thumbnail.svg",
        ]);
    }
}
