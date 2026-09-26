<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password - HBTronics</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f3f3; font-family:Arial, Helvetica, sans-serif; color:#3a3a3a;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f3f3; padding:40px 15px;">
    <tr>
        <td align="center">

            <!-- Main container -->
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                   style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden;">

                <!-- Header -->
                <tr>
                    <td align="center" style="padding:32px 30px 24px; background:#ffffff;">

                        <img
                            src="{{ config('app.frontend_url') }}/hbt-logo-full.png"
                            alt="HBTronics"
                            width="150"
                            style="display:block; max-width:150px; height:auto; border:0;"
                        >

                    </td>
                </tr>

                <!-- Orange accent -->
                <tr>
                    <td style="height:4px; background:#F47822; font-size:0; line-height:0;">
                        &nbsp;
                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding:42px 45px 35px;">

                        <p style="margin:0 0 12px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#F47822;">
                            Security notification
                        </p>

                        <h1 style="margin:0 0 20px; font-size:28px; line-height:36px; color:#3A3A3A; font-weight:700;">
                            Reset your password
                        </h1>

                        <p style="margin:0 0 18px; font-size:16px; line-height:26px; color:#555555;">
                            Hello {{ $user->first_name ?? 'there' }},
                        </p>

                        <p style="margin:0 0 18px; font-size:16px; line-height:26px; color:#555555;">
                            We received a request to reset the password for your
                            <strong>HBTronics Learning Platform</strong> account
                            ({{ $user->email }}).
                        </p>

                        <p style="margin:0 0 28px; font-size:16px; line-height:26px; color:#555555;">
                            Choose a new password using the secure link below. This link can only be used once.
                        </p>

                        <!-- Button -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 30px;">
                            <tr>
                                <td align="center" bgcolor="#F47822" style="border-radius:8px;">

                                    <a
                                        href="{{ $resetUrl }}"
                                        style="
                                            display:inline-block;
                                            padding:15px 30px;
                                            font-size:16px;
                                            font-weight:700;
                                            color:#ffffff;
                                            text-decoration:none;
                                            border-radius:8px;
                                            background:#F47822;
                                        "
                                    >
                                        Reset Password
                                    </a>

                                </td>
                            </tr>
                        </table>

                        <!-- Alternative link -->
                        <p style="margin:0 0 10px; font-size:13px; line-height:21px; color:#777777;">
                            If the button doesn't work, copy and paste the following link into your browser:
                        </p>

                        <p style="margin:0 0 28px; font-size:13px; line-height:21px; word-break:break-all;">
                            <a
                                href="{{ $resetUrl }}"
                                style="color:#F47822; text-decoration:none;"
                            >
                                {{ $resetUrl }}
                            </a>
                        </p>

                        <!-- Expiration notice -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="background:#F7F7F7; border-radius:8px;">
                            <tr>
                                <td style="padding:16px 18px;">

                                    <p style="margin:0; font-size:14px; line-height:22px; color:#666666;">
                                        <strong style="color:#3A3A3A;">Important:</strong>
                                        This reset link will expire in
                                        <strong>{{ $expiresIn }} minutes</strong>.
                                        For your security, all existing sessions will be signed out after you set a new password.
                                    </p>

                                </td>
                            </tr>
                        </table>

                        <p style="margin:28px 0 0; font-size:14px; line-height:22px; color:#777777;">
                            If you did not request a password reset, you can safely ignore this email —
                            your password will not change.
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding:25px 30px; background:#3A3A3A; text-align:center;">

                        <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#ffffff;">
                            HBTronics Learning Platform
                        </p>

                        <p style="margin:0 0 12px; font-size:12px; line-height:20px; color:#cccccc;">
                            Learn. Diagnose. Master.
                        </p>

                        <p style="margin:0; font-size:11px; line-height:18px; color:#999999;">
                            © {{ date('Y') }} HBTronics. All rights reserved.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
