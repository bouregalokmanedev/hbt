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

        // The QR lands on the branded verify page, not the raw JSON endpoint,
        // so a scan shows a certificate instead of an API payload.
        $verificationUrl = rtrim(config('app.frontend_url'), '/')
            .'/verify/'.$certificate->certificate_number;
        $qrCode = (new PngWriter())->write(new QrCode(data: $verificationUrl, size: 180, margin: 8));
        $logoPath = base_path('../frontend/src/assets/brand/hbt-logo-full.png');
        $logoData = is_file($logoPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
            : null;

        return Pdf::loadView('certificates.certificate', [
            'certificate' => $certificate,
            'verificationUrl' => $verificationUrl,
            'issuedDate' => $certificate->issued_at?->format('F j, Y') ?? '',
            'qrCode' => $qrCode->getDataUri(),
            'logoData' => $logoData,
        ])->setPaper('a4', 'landscape')->download('HBT-certificate-'.$certificate->certificate_number.'.pdf');
    }

    public function verify(string $certificateNumber): CertificateResource
    {
        $certificateNumber = trim($certificateNumber);

        abort_unless(
            $certificateNumber !== '' && strlen($certificateNumber) <= 100,
            404,
        );

        return new CertificateResource(
            Certificate::query()
                ->where('certificate_number', $certificateNumber)
                ->firstOrFail(),
        );
    }
}
