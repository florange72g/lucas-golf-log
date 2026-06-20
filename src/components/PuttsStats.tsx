interface PuttsStatsProps {
  value: number;
  label?: string;
  sub?: string;
  one: number;
  two: number;
  three: number;
}

export default function PuttsStats({
  value,
  label = 'Average Putts',
  sub = 'per round',
  one,
  two,
  three,
}: PuttsStatsProps) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-fairway-500">{label}</p>
      <p className="mt-1 text-4xl font-bold tabular-nums text-fairway-800">
        {value ? value.toFixed(1) : '—'}
      </p>
      <p className="mt-1 text-xs text-fairway-400">{sub}</p>
      <div className="mt-4 space-y-1.5 border-t border-sand pt-4 text-left text-sm">
        <PuttCount label="1-Putt" value={one} />
        <PuttCount label="2-Putt" value={two} />
        <PuttCount label="3-Putt" value={three} />
      </div>
    </div>
  );
}

function PuttCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className="font-medium text-fairway-600">{label}:</span>
      <span className="font-bold tabular-nums text-fairway-800">{value}</span>
    </div>
  );
}
