import type { HoleEntry } from '../types';

const OPTIONS: { value: Exclude<HoleEntry['fairway'], ''>; label: string }[] = [
  { value: 'Hit', label: 'Hit' },
  { value: 'Left', label: 'Left' },
  { value: 'Right', label: 'Right' },
  { value: 'N/A', label: 'N/A' },
];

interface FairwayButtonsProps {
  value: HoleEntry['fairway'];
  onChange: (value: HoleEntry['fairway']) => void;
  isPar3?: boolean;
}

export default function FairwayButtons({ value, onChange, isPar3 }: FairwayButtonsProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-fairway-800">
        Fairway
        {isPar3 && (
          <span className="ml-1 font-normal text-fairway-400">(use N/A on par 3s)</span>
        )}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`rounded-xl py-3.5 text-sm font-bold transition active:scale-[0.97] ${
              value === opt.value
                ? opt.value === 'N/A'
                  ? 'bg-sand text-fairway-800 shadow-md ring-2 ring-fairway-300 ring-offset-1'
                  : 'bg-fairway-800 text-white shadow-md'
                : 'border border-sand bg-white text-fairway-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
