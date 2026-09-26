interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

/** SVG sparkline (03). LTR technical island — time flows left→right (14 §13). */
export function Sparkline({ values, width = 96, height = 24, color = "#1F6AE1" }: Props) {
  if (values.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="ltr-island" role="img" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}
