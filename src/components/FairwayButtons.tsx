import type { HoleEntry } from '../types';
import {
  isFairwayHit,
  isFairwayLeft,
  isFairwayRight,
  toggleFairwayHit,
  toggleFairwayLeft,
  toggleFairwayNA,
  toggleFairwayRight,
} from '../types';

const OPTIONS = [
  { key: 'hit' as const, label: 'Hit' },
  { key: 'left' as const, label: 'Left' },
  { key: 'right' as const, label: 'Right' },
  { key: 'na' as const, label: 'N/A' },
];

interface FairwayButtonsProps {
  value: HoleEntry['fairway'];
  onChange: (value: HoleEntry['fairway']) => void;
  isPar3?: boolean;
}

export default function FairwayButtons({ value, onChange, isPar3 }: FairwayButtonsProps) {
  const isSelected = (key: (typeof OPTIONS)[number]['key']) => {
    if (key === 'hit') return isFairwayHit(value);
    if (key === 'left') return isFairwayLeft(value);
    if (key === 'right') return isFairwayRight(value);
    return value === 'N/A';
  };

  const handleClick = (key: (typeof OPTIONS)[number]['key']) => {
    if (key === 'hit') onChange(toggleFairwayHit(value));
    else if (key === 'left') onChange(toggleFairwayLeft(value));
    else if (key === 'right') onChange(toggleFairwayRight(value));
    else onChange(toggleFairwayNA(value));
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-fairway-800">
        Fairway
        {isPar3 && (
          <span className="ml-1 font-normal text-fairway-400">(use N/A on par 3s)</span>
        )}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const selected = isSelected(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleClick(opt.key)}
              className={`rounded-xl py-3.5 text-sm font-bold transition active:scale-[0.97] ${
                selected
                  ? opt.key === 'na'
                    ? 'bg-sand text-fairway-800 shadow-md ring-2 ring-fairway-300 ring-offset-1'
                    : 'bg-fairway-800 text-white shadow-md'
                  : 'border border-sand bg-white text-fairway-700'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
