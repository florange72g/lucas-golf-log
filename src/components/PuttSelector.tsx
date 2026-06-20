const PUTTS = [0, 1, 2, 3, 4] as const;

interface PuttSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function PuttSelector({ value, onChange }: PuttSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-fairway-800">Putting</label>
      <div className="grid grid-cols-5 gap-2">
        {PUTTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-14 flex-col items-center justify-center rounded-xl text-lg font-bold transition active:scale-[0.97] ${
              value === n
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
