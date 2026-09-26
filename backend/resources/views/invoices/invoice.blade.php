<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
    /*
      HBT invoice — A4 portrait, dompdf-safe (tables + absolute only,
      no flex/grid). Brand palette: orange #F47822, charcoal #3A3A3A,
      hairline #E6E6E6, green #008F68.
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
        width: 794px;
        height: 1123px;
        overflow: hidden;
        background: #ffffff;
    }

    .bar-top { position: absolute; left: 0; top: 0; width: 794px; height: 14px; background: #F47822; }
    .bar-bottom { position: absolute; left: 0; bottom: 0; width: 794px; height: 8px; background: #3A3A3A; }

    .content { position: absolute; left: 56px; top: 56px; width: 682px; }

    .header { width: 682px; height: 54px; margin-bottom: 34px; }
    .logo { height: 44px; }
    .brand { font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #3A3A3A; }
    .brand span { color: #F47822; }

    .title-row { position: relative; width: 682px; height: 98px; margin-bottom: 22px; }
    .invoice-title { position: absolute; right: 0; top: 0; font-size: 40px; font-weight: bold; letter-spacing: 6px; color: #3A3A3A; text-align: right; line-height: 46px; }
    .invoice-number { position: absolute; right: 0; top: 54px; font-size: 13px; letter-spacing: 1.4px; color: #6B6B6B; text-align: right; line-height: 20px; }

    .meta { width: 682px; margin-bottom: 34px; }
    .meta td { vertical-align: top; font-size: 12px; }
    .label { font-size: 10px; letter-spacing: 1.6px; text-transform: uppercase; color: #9A9A9A; margin-bottom: 7px; }
    .value { font-size: 14px; color: #3A3A3A; line-height: 21px; }
    .value-strong { font-size: 15px; font-weight: bold; color: #3A3A3A; }

    .status-chip {
        display: inline-block;
        padding: 5px 12px;
        font-size: 11px;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: #ffffff;
        background: #008F68;
    }
    .status-draft, .status-open, .status-pending { background: #3A3A3A; }
    .status-void, .status-failed, .status-cancelled, .status-uncollectible { background: #9A9A9A; }

    .items { width: 682px; border-collapse: collapse; margin-bottom: 26px; }
    .items th {
        font-size: 10px;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        color: #9A9A9A;
        text-align: left;
        padding: 10px 12px;
        border-bottom: 2px solid #3A3A3A;
    }
    .items th.num, .items td.num { text-align: right; }
    .items td {
        font-size: 13px;
        color: #3A3A3A;
        padding: 14px 12px;
        border-bottom: 1px solid #E6E6E6;
    }
    .items .qty { width: 70px; }
    .items .amount { width: 130px; }

    .totals { width: 300px; float: right; border-collapse: collapse; }
    .totals td { font-size: 13px; padding: 7px 4px; color: #6B6B6B; }
    .totals td.num { text-align: right; }
    .totals .rule { border-top: 1px solid #E6E6E6; }
    .totals .grand td {
        font-size: 17px;
        font-weight: bold;
        color: #3A3A3A;
        padding-top: 12px;
        border-top: 2px solid #F47822;
    }
    .totals .grand .accent { color: #F47822; }

    .clear { clear: both; }

    .note {
        position: absolute;
        left: 56px;
        bottom: 52px;
        width: 682px;
        font-size: 11px;
        line-height: 18px;
        color: #9A9A9A;
        border-top: 1px solid #E6E6E6;
        padding-top: 14px;
    }
    .note strong { color: #3A3A3A; }
</style>
</head>
<body>
<div class="page">
    <div class="bar-top"></div>

    <div class="content">
        <div class="header">
            @if ($logoData)
                <img class="logo" src="{{ $logoData }}" alt="HBT">
            @else
                <div class="brand">HB<span>·</span>TRONICS</div>
            @endif
        </div>

        <div class="title-row">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">
                {{ $numberLabel }}<br>
                {{ $issuedDate }}
            </div>
        </div>

        <div class="meta">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="50%">
                        <div class="label">Billed to</div>
                        <div class="value-strong">{{ $customerName }}</div>
                        <div class="value">{{ $customerEmail }}</div>
                        @if ($periodLabel)
                            <div class="label" style="margin-top:14px;">Billing period</div>
                            <div class="value">{{ $periodLabel }}</div>
                        @endif
                    </td>
                    <td width="50%" style="text-align:right;">
                        <div class="label">Status</div>
                        <span class="status-chip status-{{ $invoice->status->value }}">{{ $invoice->status->value }}</span>
                        <div class="label" style="margin-top:14px;">Currency</div>
                        <div class="value">{{ $invoice->currency }}</div>
                        @if ($invoice->paid_at)
                            <div class="label" style="margin-top:14px;">Paid on</div>
                            <div class="value">{{ $invoice->paid_at->format('F j, Y') }}</div>
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <table class="items" cellpadding="0" cellspacing="0">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="num qty">Qty</th>
                    <th class="num amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($lineItems as $line)
                    <tr>
                        <td>{{ $line['label'] }}</td>
                        <td class="num">{{ $line['qty'] }}</td>
                        <td class="num">{{ number_format($line['total']) }} {{ $invoice->currency }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <table class="totals" cellpadding="0" cellspacing="0">
            <tr>
                <td>Subtotal</td>
                <td class="num">{{ number_format($invoice->subtotal) }} {{ $invoice->currency }}</td>
            </tr>
            @if ($invoice->discount_amount > 0)
                <tr>
                    <td>Discount</td>
                    <td class="num">-{{ number_format($invoice->discount_amount) }} {{ $invoice->currency }}</td>
                </tr>
            @endif
            @if ($invoice->tax_amount > 0)
                <tr class="rule">
                    <td>Tax</td>
                    <td class="num">{{ number_format($invoice->tax_amount) }} {{ $invoice->currency }}</td>
                </tr>
            @endif
            <tr class="grand">
                <td>Total</td>
                <td class="num accent">{{ number_format($invoice->total) }} {{ $invoice->currency }}</td>
            </tr>
        </table>

        <div class="clear"></div>
    </div>

    <div class="note">
        <strong>HB·TRONICS Learning Platform</strong> — thank you for learning with us.
        This invoice was issued for provider <strong>{{ $invoice->provider }}</strong>.
        Keep this document for your records; it can be re-downloaded anytime from your billing page.
    </div>

    <div class="bar-bottom"></div>
</div>
</body>
</html>
