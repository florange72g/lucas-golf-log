const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

interface ScoreSelectorProps {
  value: number;
  par: number;
  onChange: (score: number) => void;
}

function scoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return 'Eagle or better';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double bogey';
  return `+${diff}`;
}

function scoreLabelColor(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -1) return 'text-fairway-600';
  if (diff === 0) return 'text-fairway-500';
  if (diff === 1) return 'text-orange-600';
  return 'text-red-600';
}

export default function ScoreSelector({ value, par, onChange }: ScoreSelectorProps) {
  const clamped = Math.min(10, Math.max(1, value));

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-fairway-800">Score</label>

      <div className="mb-3 rounded-xl bg-fairway-50 py-4 text-center">
        <p className="text-5xl font-bold tabular-nums text-fairway-800">{clamped}</p>
        <p className={`mt-1 text-sm font-semibold ${scoreLabelColor(clamped, par)}`}>
          {scoreLabel(clamped, par)}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {SCORES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-12 items-center justify-center rounded-xl text-lg font-bold transition active:scale-[0.97] ${
              clamped === n
                ? 'bg-fairway-800 text-white shadow-md'
                : 'border border-sand bg-white text-fairway-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
