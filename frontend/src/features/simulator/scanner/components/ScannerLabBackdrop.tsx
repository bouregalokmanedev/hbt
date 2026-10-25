export function ScannerLabBackdrop() {
    const pins = Array.from({ length: 8 }, (_, index) => index);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden dark:hidden"
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: "#eceff1",
                    backgroundImage:
                        "linear-gradient(rgba(26,26,26,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,26,0.065) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage:
                        "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, #000 12%, #000 84%, rgba(0,0,0,0.35) 100%)",
                    WebkitMaskImage:
                        "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, #000 12%, #000 84%, rgba(0,0,0,0.35) 100%)",
                }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0) 60%)",
                }}
            />

            <svg
                viewBox="0 0 360 260"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-[4%] top-[58%] hidden w-[34%] max-w-[480px] text-[#1a1a1a] rtl:left-auto rtl:right-[4%] lg:block"
                style={{ opacity: 0.06 }}
            >
                <rect x="58" y="18" width="244" height="184" rx="22" />
                <rect x="78" y="38" width="204" height="132" rx="10" />
                <path d="M96 118h32l13-30 22 64 17-42 12 20h66" />
                <circle cx="286" cy="184" r="4" />
                <path d="M58 218h244" />
            </svg>

            <svg
                viewBox="0 0 260 200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute right-[3%] top-[62%] hidden w-[21%] max-w-[300px] text-[#1a1a1a] rtl:left-[3%] rtl:right-auto lg:block"
                style={{ opacity: 0.065 }}
            >
                <path d="M40 42h180l22 44v34c0 10-8 18-18 18H36c-10 0-18-8-18-18V86l22-44Z" />
                {pins.map((pin) => (
                    <rect
                        key={`top-${pin}`}
                        x={48 + pin * 17}
                        y="64"
                        width="9"
                        height="11"
                        rx="2"
                    />
                ))}
                {pins.map((pin) => (
                    <rect
                        key={`bottom-${pin}`}
                        x={48 + pin * 17}
                        y="88"
                        width="9"
                        height="11"
                        rx="2"
                    />
                ))}
                <path d="M130 138c0 24 18 40 42 40h56" />
            </svg>
        </div>
    );
}
