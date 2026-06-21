import { useRef, useState } from 'react';
import type { TournamentResult } from '../types';

const DELETE_WIDTH = 76;
const OPEN_THRESHOLD = 38;

const DELETE_CONFIRM =
  'Remove this tournament result from your recruiting report? This cannot be undone.';

interface SwipeableTournamentResultRowProps {
  result: TournamentResult;
  locked: boolean;
  onDelete: (id: string) => void;
}

export default function SwipeableTournamentResultRow({
  result,
  locked,
  onDelete,
}: SwipeableTournamentResultRowProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const tracking = useRef(false);
  const swiping = useRef(false);

  const closeRow = () => {
    setOffset(0);
    swiping.current = false;
    tracking.current = false;
  };

  const openRow = () => {
    setOffset(-DELETE_WIDTH);
    swiping.current = true;
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (locked) return;
    startX.current = event.touches[0].clientX;
    startY.current = event.touches[0].clientY;
    startOffset.current = offset;
    tracking.current = true;
    swiping.current = false;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!tracking.current) return;

    const deltaX = event.touches[0].clientX - startX.current;
    const deltaY = event.touches[0].clientY - startY.current;

    if (!swiping.current && Math.abs(deltaX) < Math.abs(deltaY)) {
      tracking.current = false;
      return;
    }

    if (Math.abs(deltaX) > 8) {
      swiping.current = true;
    }

    if (!swiping.current) return;

    const next = Math.min(0, Math.max(-DELETE_WIDTH, startOffset.current + deltaX));
    setOffset(next);
  };

  const handleTouchEnd = () => {
    if (!tracking.current) return;
    tracking.current = false;

    if (!swiping.current) return;

    if (offset <= -OPEN_THRESHOLD) {
      openRow();
      return;
    }

    closeRow();
  };

  const handleDelete = () => {
    if (locked) {
      window.alert('Profile is locked. Unlock to delete tournament results.');
      closeRow();
      return;
    }
    if (window.confirm(DELETE_CONFIRM)) {
      onDelete(result.id);
      return;
    }
    closeRow();
  };

  return (
    <div className="swipe-row overflow-hidden rounded-xl border border-sand bg-white print:border-0">
      <button
        type="button"
        onClick={handleDelete}
        disabled={locked}
        aria-label={`Delete ${result.name}`}
        className="swipe-row-delete absolute inset-y-0 right-0 flex w-[76px] flex-col items-center justify-center gap-1 bg-red-600 text-white print:hidden disabled:opacity-40"
      >
        <DeleteIcon />
        <span className="text-[10px] font-bold uppercase tracking-wide">Delete</span>
      </button>

      <article
        className="swipe-row-content relative bg-white px-4 py-3 print:px-0"
        style={{
          transform: `translateX(${offset}px)`,
          transition: tracking.current ? 'none' : 'transform 180ms ease-out',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <h4 className="text-sm font-semibold leading-snug text-fairway-800">{result.name}</h4>
        <div className="mt-2 space-y-0.5 text-sm text-fairway-600">
          {result.finish && (
            <p>
              <span className="font-semibold text-fairway-700">Finish:</span>{' '}
              <span className="font-bold tabular-nums text-fairway-800">{result.finish}</span>
            </p>
          )}
          <p>
            <span className="font-semibold text-fairway-700">Scores:</span>{' '}
            <span className="tabular-nums">{result.scores}</span>
          </p>
        </div>
        {result.url && (
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block text-xs font-semibold text-fairway-500 underline print:text-fairway-700"
            onClick={(event) => {
              if (offset < 0) event.preventDefault();
            }}
          >
            View results →
          </a>
        )}
      </article>
    </div>
  );
}

function DeleteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4h8v2m-1 4v8M10 10v8M14 10v8M5 6l1 14h12l1-14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
