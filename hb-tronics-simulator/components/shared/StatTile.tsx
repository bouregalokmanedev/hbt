interface Props {
  label: string;
  value: string | number;
  unit?: string;
}

/** Stat tile (03). Class-B numeric values stay canonical/LTR. */
export function StatTile({ label, value, unit }: Props) {
  return (
    <div className="rounded-lg border border-line bg-paper p-3.5">
      <div className="t-eyebrow text-neutralx-fg3">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span dir="ltr" className="t-mono text-[22px] font-semibold text-ink">
          {value}
        </span>
        {unit ? (
          <span dir="ltr" className="t-mono text-xs text-neutralx-fg">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
