import type { HoleEntry } from '../types';

const OPTIONS: { value: Exclude<HoleEntry['gir'], ''>; label: string }[] = [
  { value: 'Hit', label: 'Hit' },
  { value: 'Miss', label: 'Miss' },
  { value: 'N/A', label: 'N/A' },
];

interface GIRButtonsProps {
  value: HoleEntry['gir'];
  onChange: (value: HoleEntry['gir']) => void;
}

export default function GIRButtons({ value, onChange }: GIRButtonsProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-fairway-800">
        GIR <span className="font-normal text-fairway-400">(Green in Regulation)</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`rounded-xl py-4 text-sm font-bold transition active:scale-[0.97] ${
              value === opt.value
                ? opt.value === 'Hit'
                  ? 'bg-fairway-600 text-white shadow-md ring-2 ring-fairway-400 ring-offset-1'
                  : opt.value === 'Miss'
                    ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400 ring-offset-1'
                    : 'bg-sand text-fairway-800 shadow-md ring-2 ring-fairway-300 ring-offset-1'
                : opt.value === 'Miss'
                  ? 'border-2 border-red-200 bg-red-50 text-red-700'
                  : opt.value === 'Hit'
                    ? 'border-2 border-fairway-200 bg-fairway-50 text-fairway-700'
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
