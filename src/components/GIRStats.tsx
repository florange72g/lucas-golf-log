interface GIRStatsProps {
  pct: number;
  hit: number;
  miss: number;
}

export default function GIRStats({ pct, hit, miss }: GIRStatsProps) {
  const hasData = hit + miss > 0;

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-fairway-500">GIR %</p>
      <p className="mt-1 text-4xl font-bold tabular-nums text-fairway-800">
        {hasData ? `${pct}%` : '—'}
      </p>
      <div className="mt-4 space-y-1.5 border-t border-sand pt-4 text-sm">
        <GIRCount label="Greens Hit" value={hit} />
        <GIRCount label="Greens Missed" value={miss} />
      </div>
    </div>
  );
}

function GIRCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className="font-medium text-fairway-600">{label}:</span>
      <span className="font-bold tabular-nums text-fairway-800">{value}</span>
    </div>
  );
}
