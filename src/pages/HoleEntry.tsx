import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClubSelect from '../components/ClubSelect';
import FairwayButtons from '../components/FairwayButtons';
import GIRButtons from '../components/GIRButtons';
import PageHeader from '../components/PageHeader';
import PuttSelector from '../components/PuttSelector';
import ScoreSelector from '../components/ScoreSelector';
import { useGolf } from '../context/GolfContext';
import type { HoleEntry } from '../types';
import { DRIVER_CLUBS, IRON_WOOD_CLUBS, isHoleLogged, normalizeHole } from '../types';
import { isValidPar, parAsNumber } from '../utils/parInput';
import { yardsAsNumber } from '../utils/yardsInput';
import {
  backNine,
  calcTotalScore,
  formatScoreToPar,
  frontNine,
  nineScore,
  scoreToPar,
} from '../utils/stats';

export default function HoleEntry() {
  const navigate = useNavigate();
  const { activeRound, updateActiveRound, saveActiveRound, editingSavedRound, saveEditedRound } =
    useGolf();
  const [currentHole, setCurrentHole] = useState(0);
  const [nine, setNine] = useState<'front' | 'back'>('front');

  if (!activeRound) {
    return (
      <>
        <PageHeader title="18 Hole Entry" backTo="/" />
        <div className="px-4 pt-8 text-center">
          <p className="text-fairway-500">No active round. Start a new round first.</p>
          <button type="button" onClick={() => navigate('/new-round')} className="btn-primary mt-4">
            New Round
          </button>
        </div>
      </>
    );
  }

  const holes = nine === 'front' ? frontNine(activeRound.holes) : backNine(activeRound.holes);
  const holeIndex = nine === 'front' ? currentHole : currentHole + 9;
  const hole = activeRound.holes[holeIndex];
  const isPar3 = hole.par === 3;

  const frontTotal = nineScore(frontNine(activeRound.holes));
  const backTotal = nineScore(backNine(activeRound.holes));
  const roundTotal = calcTotalScore(activeRound.holes);
  const roundToPar = scoreToPar(activeRound.holes);

  const updateHole = (updates: Partial<HoleEntry>) => {
    updateActiveRound((prev) => {
      const newHoles = [...prev.holes];
      newHoles[holeIndex] = normalizeHole({ ...newHoles[holeIndex], ...updates });
      return { holes: newHoles };
    });
  };

  const roundId = activeRound.id;
  const holeBackTo = editingSavedRound ? `/edit-round/${roundId}` : '/';

  const goNext = () => {
    if (currentHole < 8) {
      setCurrentHole(currentHole + 1);
    } else if (nine === 'front') {
      setNine('back');
      setCurrentHole(0);
    } else if (editingSavedRound) {
      saveEditedRound();
      navigate(`/round-summary/${roundId}`);
    } else {
      saveActiveRound();
      navigate('/round-summary/active');
    }
  };

  const goPrev = () => {
    if (currentHole > 0) {
      setCurrentHole(currentHole - 1);
    } else if (nine === 'back') {
      setNine('front');
      setCurrentHole(8);
    }
  };

  const switchNine = (target: 'front' | 'back') => {
    setNine(target);
    setCurrentHole(0);
  };

  return (
    <>
      <PageHeader
        title={`Hole ${hole.hole}`}
        subtitle={`${activeRound.courseName} · ${formatScoreToPar(roundToPar)}`}
        backTo={holeBackTo}
        action={
          editingSavedRound ? (
            <button
              type="button"
              onClick={() => {
                saveEditedRound();
                navigate(`/round-summary/${roundId}`);
              }}
              className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-fairway-900"
            >
              Save
            </button>
          ) : undefined
        }
      />

      <div className="space-y-4 px-4 pt-1 pb-[calc(10rem+env(safe-area-inset-bottom,0px))]">
        {/* Nine toggle + hole strip */}
        <div className="flex gap-2">
          <NineToggle
            label="Front 9"
            score={frontTotal}
            active={nine === 'front'}
            onClick={() => switchNine('front')}
          />
          <NineToggle
            label="Back 9"
            score={backTotal}
            active={nine === 'back'}
            onClick={() => switchNine('back')}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
          {holes.map((h, i) => (
            <button
              key={h.hole}
              type="button"
              onClick={() => setCurrentHole(i)}
              className={`flex h-11 min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg text-sm font-bold transition ${
                i === currentHole
                  ? 'bg-fairway-800 text-white shadow-sm'
                  : isHoleLogged(h)
                    ? 'bg-fairway-100 text-fairway-800'
                    : 'border border-sand bg-white text-fairway-400'
              }`}
            >
              {h.hole}
            </button>
          ))}
        </div>

        {/* Hole info row */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-sand bg-white p-3">
          <InfoCell label="Hole" value={hole.hole} />
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-fairway-400">Par</p>
            <input
              type="text"
              inputMode="numeric"
              value={hole.par ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                const par = value === '' ? '' : Number(value);
                const scoreUpdates =
                  typeof par === 'number' && isValidPar(par)
                    ? {
                        score: Math.min(10, Math.max(1, par)),
                        ...(par === 3
                          ? { fairway: 'N/A' as const }
                          : hole.fairway === 'N/A'
                            ? { fairway: '' as const }
                            : {}),
                      }
                    : {};
                updateHole({ par, ...scoreUpdates });
              }}
              className="mt-0.5 w-full bg-transparent text-center text-2xl font-bold text-fairway-800 outline-none"
            />
          </div>
          <InfoCell
            label="Yards"
            value={yardsAsNumber(hole.yards)}
            editable
            onChange={(v) => updateHole({ yards: v })}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-sand bg-white p-4 shadow-sm">
          <ClubSelect
            label="Tee Shot Club"
            value={hole.driver}
            options={DRIVER_CLUBS}
            onChange={(v) => updateHole({ driver: v })}
            placeholder="Select club"
          />

          <FairwayButtons
            value={hole.fairway}
            onChange={(v) => updateHole({ fairway: v })}
            isPar3={isPar3}
          />

          <GIRButtons
            value={hole.gir}
            onChange={(v) => updateHole({ gir: v })}
          />

          <ClubSelect
            label="Iron/Wood 1"
            value={hole.iron1}
            options={IRON_WOOD_CLUBS}
            onChange={(v) => updateHole({ iron1: v })}
            placeholder="Select club"
          />

          <ClubSelect
            label="Iron/Wood 2"
            value={hole.iron2}
            options={IRON_WOOD_CLUBS}
            onChange={(v) => updateHole({ iron2: v })}
            placeholder="Select club"
            optional
          />

          <ScoreSelector
            value={hole.score}
            par={parAsNumber(hole.par)}
            onChange={(score) => updateHole({ score })}
          />

          <PuttSelector
            value={hole.putts}
            onChange={(v) => updateHole({ putts: v })}
          />
        </div>

        <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-sm font-semibold text-fairway-800">Personal Note</label>
          <textarea
            value={hole.notes}
            onChange={(e) => updateHole({ notes: e.target.value })}
            rows={3}
            placeholder="Add your own note for this hole..."
            className="input-field min-h-[5.5rem] resize-y text-base leading-relaxed"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={nine === 'front' && currentHole === 0}
            className="btn-secondary flex-1 disabled:opacity-30"
          >
            Previous
          </button>
          <button type="button" onClick={goNext} className="btn-primary flex-1">
            {editingSavedRound && nine === 'back' && currentHole === 8
              ? 'Save Round'
              : nine === 'back' && currentHole === 8
                ? 'Finish Round'
                : 'Next Hole'}
          </button>
        </div>
      </div>

      {/* Sticky round totals — above bottom nav */}
      <div
        className="fixed left-0 right-0 z-40"
        style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto max-w-lg px-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-fairway-800 px-3 py-3 text-center text-white shadow-lg shadow-fairway-900/25">
            <TotalCell label="Front 9" value={frontTotal} />
            <TotalCell label="Back 9" value={backTotal} />
            <TotalCell label="Round" value={roundTotal} highlight />
          </div>
        </div>
      </div>
    </>
  );
}

function NineToggle({
  label,
  score,
  active,
  onClick,
}: {
  label: string;
  score: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-center transition active:scale-[0.98] ${
        active ? 'bg-fairway-800 text-white' : 'border border-sand bg-white text-fairway-600'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-xl font-bold">{score}</p>
    </button>
  );
}

function InfoCell({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: number;
  editable?: boolean;
  onChange?: (v: number) => void;
}) {
  if (editable && onChange) {
    return (
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-fairway-400">{label}</p>
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? '' : value}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') return;
            const parsed = Number(raw);
            if (Number.isNaN(parsed)) return;
            onChange(parsed);
          }}
          className="mt-0.5 w-full bg-transparent text-center text-2xl font-bold text-fairway-800 outline-none"
        />
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-fairway-400">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-fairway-800">{value}</p>
    </div>
  );
}

function TotalCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-fairway-300">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-gold-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
