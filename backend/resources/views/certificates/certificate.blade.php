<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
    /*
      HBT branded credential — A4 landscape, brand palette only
      (orange #F47822, charcoal #3A3A3A, hairline #E6E6E6).
      dompdf: no flex/grid, no transforms — layout is absolute + tables.
    */
    @page { margin: 0; }
    * { box-sizing: border-box; }

    body {
        margin: 0;
        font-family: DejaVu Sans, sans-serif;
        color: #3A3A3A;
        background: #ffffff;
    }

    .page {
        position: relative;
        width: 1122px;
        height: 793px;
        overflow: hidden;
        background: #ffffff;
    }

    /* Brand edges */
    .bar-top { position: absolute; left: 0; top: 0; width: 1122px; height: 16px; background: #F47822; }
    .bar-bottom { position: absolute; left: 0; bottom: 0; width: 1122px; height: 8px; background: #3A3A3A; }
    .band-left { position: absolute; left: 0; top: 16px; width: 12px; height: 769px; background: #3A3A3A; }

    /* Double frame: hairline charcoal + orange rule inset */
    .frame-outer { position: absolute; left: 44px; top: 48px; width: 1034px; height: 700px; border: 1px solid #E6E6E6; }
    .frame-inner { position: absolute; left: 52px; top: 56px; width: 1018px; height: 684px; border: 2px solid #F47822; }

    /* Corner ticks */
    .tick { position: absolute; width: 26px; height: 26px; background: #F47822; }
    .tick-tl { left: 44px; top: 48px; }
    .tick-tr { left: 1052px; top: 48px; }
    .tick-bl { left: 44px; top: 722px; }
    .tick-br { left: 1052px; top: 722px; }

    /* Ghost wordmark */
    .ghost {
        position: absolute;
        left: 0;
        top: 300px;
        width: 1122px;
        text-align: center;
        font-size: 128px;
        font-weight: bold;
        letter-spacing: 18px;
        color: #F47822;
        opacity: 0.04;
    }

    /* Header */
    .header { position: absolute; left: 78px; top: 78px; width: 966px; height: 56px; }
    .brand-logo { position: absolute; left: 0; top: 0; height: 46px; }
    .brand-fallback { position: absolute; left: 0; top: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #3A3A3A; }
    .brand-fallback span { color: #F47822; }
    .header-right { position: absolute; right: 0; top: 4px; width: 430px; text-align: right; }
    .header-right .line1 { font-size: 11px; font-weight: bold; letter-spacing: 3.5px; color: #3A3A3A; text-transform: uppercase; }
    .header-right .line2 { font-size: 10px; letter-spacing: 1.6px; color: #8A8A8A; margin-top: 6px; text-transform: uppercase; }
    .header-rule { position: absolute; left: 78px; top: 146px; width: 966px; height: 1px; background: #E6E6E6; }

    /* Body */
    .eyebrow {
        position: absolute; left: 0; top: 184px; width: 1122px;
        text-align: center; font-size: 13px; font-weight: bold;
        letter-spacing: 6px; color: #F47822; text-transform: uppercase;
    }
    .title {
        position: absolute; left: 0; top: 212px; width: 1122px;
        text-align: center; font-size: 42px; font-weight: bold;
        letter-spacing: 0.5px; color: #3A3A3A;
    }
    .rule { position: absolute; left: 511px; top: 276px; width: 100px; height: 4px; background: #F47822; }
    .lead {
        position: absolute; left: 161px; top: 306px; width: 800px;
        text-align: center; font-size: 14px; letter-spacing: 1px; color: #8A8A8A;
    }
    .recipient {
        position: absolute; left: 91px; top: 336px; width: 940px;
        text-align: center; font-size: 42px; font-weight: bold; color: #3A3A3A;
    }
    .recipient-rule { position: absolute; left: 361px; top: 400px; width: 400px; height: 1px; background: #E6E6E6; }
    .lead2 {
        position: absolute; left: 161px; top: 418px; width: 800px;
        text-align: center; font-size: 14px; letter-spacing: 1px; color: #8A8A8A;
    }
    .course {
        position: absolute; left: 131px; top: 446px; width: 860px;
        text-align: center; font-size: 27px; font-weight: bold; color: #3A3A3A;
    }
    .course span { color: #F47822; }
    .meta {
        position: absolute; left: 161px; top: 502px; width: 800px;
        text-align: center; font-size: 12px; letter-spacing: 1.4px; color: #8A8A8A;
    }

    /* Footer: signature / seal / QR */
    .signature { position: absolute; left: 96px; top: 600px; width: 300px; text-align: center; }
    .signature .name { font-size: 15px; font-weight: bold; color: #3A3A3A; }
    .signature .line { height: 1px; background: #3A3A3A; margin-top: 34px; }
    .signature .role { font-size: 10px; letter-spacing: 2px; color: #8A8A8A; text-transform: uppercase; margin-top: 8px; }

    .seal {
        position: absolute; left: 511px; top: 588px; width: 100px; height: 100px;
        border: 3px solid #F47822; border-radius: 50%; text-align: center; padding-top: 20px;
    }
    .seal .s1 { font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #3A3A3A; }
    .seal .s2 { font-size: 8px; letter-spacing: 2.4px; color: #8A8A8A; margin-top: 4px; text-transform: uppercase; }
    .seal .s3 { font-size: 8px; letter-spacing: 2.4px; color: #008F68; margin-top: 4px; text-transform: uppercase; font-weight: bold; }

    .verify { position: absolute; left: 796px; top: 588px; width: 230px; text-align: center; }
    .verify img { width: 92px; height: 92px; }
    .verify .v1 { font-size: 10px; letter-spacing: 2px; color: #3A3A3A; font-weight: bold; text-transform: uppercase; margin-top: 8px; }
    .verify .v2 { font-size: 7px; letter-spacing: 0.2px; color: #8A8A8A; margin-top: 5px; white-space: nowrap; }

    .verified-chip {
        position: absolute; right: 78px; top: 168px;
        background: #EAF7F2; border: 1px solid #008F68; color: #008F68;
        font-size: 9px; font-weight: bold; letter-spacing: 1.6px;
        padding: 5px 10px; text-transform: uppercase;
    }

    .footer-note {
        position: absolute; left: 0; top: 762px; width: 1122px;
        text-align: center; font-size: 9px; letter-spacing: 1.6px; color: #A6A6A6; text-transform: uppercase;
    }
</style>
</head>
<body>
<div class="page">
    <div class="bar-top"></div>
    <div class="bar-bottom"></div>
    <div class="band-left"></div>

    <div class="ghost">HBTRONICS</div>

    <div class="frame-outer"></div>
    <div class="frame-inner"></div>
    <div class="tick tick-tl"></div>
    <div class="tick tick-tr"></div>
    <div class="tick tick-bl"></div>
    <div class="tick tick-br"></div>

    <div class="header">
        @if($logoData)
            <img class="brand-logo" src="{{ $logoData }}" alt="HBT">
        @else
            <div class="brand-fallback">HB<span>·</span>TRONICS</div>
        @endif
        <div class="header-right">
            <div class="line1">HB·TRONICS — E-Learning Platform</div>
            <div class="line2">Simulator labs · Diagnostics · Verified credentials</div>
        </div>
    </div>
    <div class="header-rule"></div>
    <div class="verified-chip">Verified credential</div>

    <div class="eyebrow">Certificate of completion</div>
    <div class="title">Certificate of Achievement</div>
    <div class="rule"></div>

    <div class="lead">This certifies that</div>
    <div class="recipient">{{ $certificate->recipient_name }}</div>
    <div class="recipient-rule"></div>
    <div class="lead2">has successfully completed the course of study in</div>
    <div class="course"><span>“</span>{{ $certificate->course_title }}<span>”</span></div>
    <div class="meta">Issued {{ $issuedDate }} &nbsp;·&nbsp; Certificate ID: {{ $certificate->certificate_number }}</div>

    <div class="signature">
        <div class="name">HBT Learning</div>
        <div class="line"></div>
        <div class="role">Issuing authority</div>
    </div>

    <div class="seal">
        <div class="s1">HBT</div>
        <div class="s2">Learning</div>
        <div class="s3">Verified</div>
    </div>

    <div class="verify">
        <img src="{{ $qrCode }}" alt="QR">
        <div class="v1">Scan to verify</div>
        <div class="v2">{{ $verificationUrl }}</div>
    </div>

    <div class="footer-note">This credential can be independently verified at the certificate ID above</div>
</div>
</body>
</html>
