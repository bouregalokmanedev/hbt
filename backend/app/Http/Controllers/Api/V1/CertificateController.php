<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

final class CertificateController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CertificateResource::collection(
            Certificate::query()
                ->where('user_id', auth()->id())
                ->latest('issued_at')
                ->get(),
        );
    }

    public function show(Certificate $certificate): CertificateResource
    {
        abort_unless(
            $certificate->user_id === auth()->id(),
            404,
        );

        return new CertificateResource($certificate);
    }

    public function download(Certificate $certificate)
    {
        abort_unless($certificate->user_id === auth()->id(), 404);

        $verificationUrl = url('/api/v1/certificates/verify/'.$certificate->certificate_number);
        $qrCode = (new PngWriter())->write(new QrCode(data: $verificationUrl, size: 180, margin: 8));
        $logoPath = base_path('../frontend/src/assets/brand/hbt-logo-full.png');
        $logoData = is_file($logoPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
            : null;
        $backgroundPath = base_path('../frontend/src/assets/brand/auth-background-11.png');
        $backgroundData = is_file($backgroundPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($backgroundPath))
            : null;

        return Pdf::loadView('certificates.certificate', [
            'certificate' => $certificate,
            'verificationUrl' => $verificationUrl,
            'qrCode' => $qrCode->getDataUri(),
            'logoData' => $logoData,
            'backgroundData' => $backgroundData,
        ])->setPaper('a4', 'landscape')->download('HBT-certificate-'.$certificate->certificate_number.'.pdf');
    }

    public function verify(string $certificateNumber): CertificateResource
    {
        return new CertificateResource(
            Certificate::query()
                ->where('certificate_number', $certificateNumber)
                ->firstOrFail(),
        );
    }
}
