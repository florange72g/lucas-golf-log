interface FairwayStatsProps {
  pct: number;
  hit: number;
  left: number;
  right: number;
}

export default function FairwayStats({ pct, hit, left, right }: FairwayStatsProps) {
  const hasData = hit + left + right > 0;

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-fairway-500">Fairway %</p>
      <p className="mt-1 text-4xl font-bold tabular-nums text-fairway-800">
        {hasData ? `${pct}%` : '—'}
      </p>
      <div className="mt-4 space-y-1.5 border-t border-sand pt-4 text-sm">
        <FairwayCount label="Hit" value={hit} />
        <FairwayCount label="Left" value={left} />
        <FairwayCount label="Right" value={right} />
      </div>
    </div>
  );
}

function FairwayCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className="font-medium text-fairway-600">{label}:</span>
      <span className="font-bold tabular-nums text-fairway-800">{value}</span>
    </div>
  );
}
