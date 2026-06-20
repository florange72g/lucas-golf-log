import type { Round } from '../types';
import { isRoundLocked, UNLOCK_CONFIRM } from '../utils/roundLock';

interface RoundLockControlProps {
  round: Pick<Round, 'completed' | 'isLocked'>;
  onSetLocked: (locked: boolean) => void;
  className?: string;
  variant?: 'default' | 'onDark';
}

export default function RoundLockControl({
  round,
  onSetLocked,
  className = '',
  variant = 'default',
}: RoundLockControlProps) {
  if (!round.completed) return null;

  const locked = isRoundLocked(round);
  const onDark = variant === 'onDark';

  const handleToggle = () => {
    if (locked) {
      if (window.confirm(UNLOCK_CONFIRM)) {
        onSetLocked(false);
      }
      return;
    }
    onSetLocked(true);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span
        className={`text-xs font-semibold ${onDark ? 'text-fairway-100' : 'text-fairway-600'}`}
      >
        {locked ? '🔒 Locked' : '🔓 Unlocked'}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition active:opacity-80 ${
          onDark
            ? 'border-fairway-300/60 bg-fairway-900/40 text-white'
            : 'border-fairway-300 bg-white text-fairway-700 active:bg-fairway-50'
        }`}
      >
        {locked ? 'Unlock' : 'Lock'}
      </button>
    </div>
  );
}
