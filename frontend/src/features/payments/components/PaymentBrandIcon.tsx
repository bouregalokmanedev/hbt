import { Apple, CreditCard, Wallet } from "lucide-react";

import type { ReactNode } from "react";

type IconProps = {
  brand?: string | null;
  type?: string;
  className?: string;
};

function Tile({
  children,
  className = "",
  brand,
}: {
  children: ReactNode;
  className?: string;
  brand: string;
}) {
  return (
    <span
      data-brand={brand}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E6E6E6] bg-white shadow-sm dark:border-white/10 dark:bg-white ${className}`}
    >
      {children}
    </span>
  );
}

function MastercardMark() {
  return (
    <span className="relative inline-block h-4 w-6">
      <span className="absolute left-0 top-0 h-4 w-4 rounded-full bg-[#EB001B]" />
      <span className="absolute right-0 top-0 h-4 w-4 rounded-full bg-[#F79E1B] opacity-90 mix-blend-multiply" />
    </span>
  );
}

function TamaraMark() {
  return (
    <span className="text-[10px] font-black leading-none tracking-tight lowercase text-[#5300BA]">
      tamara
    </span>
  );
}

function PaypalMark() {
  return (
    <span className="text-sm font-black italic leading-none tracking-tighter">
      <span className="text-[#003087]">P</span>
      <span className="text-[#009CDE]">P</span>
    </span>
  );
}

export function PaymentBrandIcon({ brand, type, className = "" }: IconProps) {
  const key = `${brand ?? ""} ${type ?? ""}`.toLowerCase();

  if (key.includes("visa")) {
    return (
      <Tile className={className} brand="visa">
        <span className="text-[11px] font-black italic leading-none tracking-tight text-[#1A1F71]">
          VISA
        </span>
      </Tile>
    );
  }

  if (key.includes("master")) {
    return (
      <Tile className={className} brand="mastercard">
        <MastercardMark />
      </Tile>
    );
  }

  if (key.includes("amex") || key.includes("american")) {
    return (
      <Tile className={className} brand="amex">
        <span className="text-[10px] font-black leading-none tracking-tight text-[#2E77BC]">
          AMEX
        </span>
      </Tile>
    );
  }

  if (key.includes("tamara")) {
    return (
      <Tile className={className} brand="tamara">
        <TamaraMark />
      </Tile>
    );
  }

  if (key.includes("apple")) {
    return (
      <Tile className={className} brand="apple_pay">
        <Apple className="h-4 w-4 text-black dark:text-black" strokeWidth={2.5} />
      </Tile>
    );
  }

  if (key.includes("paypal")) {
    return (
      <Tile className={className} brand="paypal">
        <PaypalMark />
      </Tile>
    );
  }

  if (key.includes("wallet")) {
    return (
      <Tile className={className} brand="wallet">
        <Wallet className="h-4 w-4 text-[#3A3A3A] dark:text-[#3A3A3A]" />
      </Tile>
    );
  }

  return (
    <Tile className={className} brand="card">
      <CreditCard className="h-4 w-4 text-[#F47822]" />
    </Tile>
  );
}
