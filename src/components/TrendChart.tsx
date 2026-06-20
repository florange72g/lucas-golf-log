interface TrendPoint {
  id: string;
  label: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: TrendPoint[];
  formatValue?: (value: number) => string;
  barClass?: string;
  referenceValue?: number;
  referenceLabel?: string;
}

export default function TrendChart({
  title,
  data,
  formatValue = (v) => String(v),
  barClass = 'bg-fairway-500',
  referenceValue,
  referenceLabel = 'Avg',
}: TrendChartProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const ref = referenceValue ?? values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(dataMin, ref);
  const max = Math.max(dataMax, ref);
  const range = max - min || 1;

  const barHeight = (value: number) => `${((value - min) / range) * 70 + 30}%`;

  return (
    <section className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-fairway-600">{title}</h2>
        {referenceValue !== undefined && (
          <span className="text-[10px] font-semibold text-fairway-400">
            {referenceLabel}: {formatValue(referenceValue)}
          </span>
        )}
      </div>
      <div className="relative flex items-end justify-between gap-1" style={{ height: 128 }}>
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-gold-400/60"
          style={{ bottom: `${((ref - min) / range) * 70 + 30}%` }}
        />
        {data.map((point) => (
          <div key={point.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold tabular-nums text-fairway-700">
              {formatValue(point.value)}
            </span>
            <div className="flex w-full items-end" style={{ height: 80 }}>
              <div
                className={`w-full rounded-t-md ${barClass} transition-all`}
                style={{ height: barHeight(point.value) }}
              />
            </div>
            <span className="max-w-full truncate text-[9px] text-fairway-400">{point.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
