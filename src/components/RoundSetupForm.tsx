import { useEffect, useState } from 'react';
import { useGolf } from '../context/GolfContext';
import CourseNameAutocomplete from './CourseNameAutocomplete';
import { ROUND_TYPES, normalizeHole, type HoleEntry, type RoundType } from '../types';
import {
  isValidPar,
  PAR_ERROR_MESSAGE,
  parAsNumber,
} from '../utils/parInput';

const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Windy', 'Rain', 'Cold', 'Hot'] as const;

interface RoundSetupFormProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function RoundSetupForm({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
}: RoundSetupFormProps) {
  const { activeRound, updateActiveRound, savedCourses, applySavedCourse } = useGolf();
  if (!activeRound) return null;

  const round = activeRound;
  const [parErrors, setParErrors] = useState<Record<number, string>>({});

  const holesSignature = round.holes.map((h) => `${h.hole}:${h.par}:${h.yards}`).join('|');
  useEffect(() => {
    setParErrors({});
  }, [holesSignature]);

  const setRoundType = (roundType: RoundType) => {
    updateActiveRound({
      roundType,
      tournamentName: roundType === 'tournament' ? round.tournamentName : undefined,
    });
  };

  const updateHoleLayout = (index: number, updates: Pick<HoleEntry, 'par' | 'yards'>) => {
    const current = round.holes[index];
    const par = updates.par ?? current.par;
    const yards = updates.yards ?? current.yards;

    const parUpdates =
      updates.par !== undefined && typeof par === 'number' && isValidPar(par)
        ? {
            score: Math.min(10, Math.max(1, par)),
            ...(par === 3
              ? { fairway: 'N/A' as const }
              : current.fairway === 'N/A'
                ? { fairway: '' as const }
                : {}),
          }
        : {};

    const newHoles = [...round.holes];
    newHoles[index] = normalizeHole({
      ...current,
      par,
      yards,
      ...parUpdates,
    });
    updateActiveRound({ holes: newHoles });
  };

  const clearParError = (holeNumber: number) => {
    if (!parErrors[holeNumber]) return;
    setParErrors((prev) => {
      const next = { ...prev };
      delete next[holeNumber];
      return next;
    });
  };

  const handleParBlur = (holeNumber: number, par: HoleEntry['par']) => {
    if (par === '') return;
    if (typeof par === 'number' && !isValidPar(par)) {
      setParErrors((prev) => ({ ...prev, [holeNumber]: PAR_ERROR_MESSAGE }));
    }
  };

  const validateAllPars = (): boolean => {
    const errors: Record<number, string> = {};

    round.holes.forEach((hole) => {
      if (typeof hole.par !== 'number' || !isValidPar(hole.par)) {
        errors[hole.hole] = PAR_ERROR_MESSAGE;
      }
    });

    if (Object.keys(errors).length > 0) {
      setParErrors(errors);
      return false;
    }

    setParErrors({});
    return true;
  };

  const handlePrimary = () => {
    if (!validateAllPars()) return;
    onPrimary();
  };

  const handleSecondary = () => {
    if (!validateAllPars()) return;
    onSecondary?.();
  };

  const parseYardsInput = (value: string): number => {
    if (value.trim() === '') return 0;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return 0;
    return Math.min(700, Math.max(0, Math.round(parsed)));
  };

  const totalPar = round.holes.reduce((sum, hole) => sum + parAsNumber(hole.par), 0);
  const totalYards = round.holes.reduce((sum, hole) => sum + hole.yards, 0);

  return (
    <div className="space-y-4 px-4 pt-1 pb-6">
      <section className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
        <Field label="Course Name">
          <CourseNameAutocomplete
            value={round.courseName}
            courses={savedCourses}
            onChange={(courseName) => updateActiveRound({ courseName })}
            onSelectCourse={applySavedCourse}
          />
        </Field>

        <Field label="Location" className="mt-4">
          <input
            type="text"
            value={round.location}
            onChange={(e) => updateActiveRound({ location: e.target.value })}
            placeholder="St. Jean, QC"
            className="input-field"
          />
        </Field>

        <Field label="Date" className="mt-4">
          <input
            type="date"
            value={round.date}
            onChange={(e) => updateActiveRound({ date: e.target.value })}
            className="input-field"
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Round Type">
            <select
              value={round.roundType}
              onChange={(e) => setRoundType(e.target.value as RoundType)}
              className="select-field"
            >
              <option value="practice">Practice</option>
              <option value="tournament">Tournament</option>
              <option value="all-18">All 18 Holes</option>
            </select>
          </Field>

          <Field label="Weather">
            <select
              value={round.weather}
              onChange={(e) => updateActiveRound({ weather: e.target.value })}
              className="select-field"
            >
              {WEATHER_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-fairway-400">
          {ROUND_TYPES.find((t) => t.value === round.roundType)?.description}
        </p>

        {round.roundType === 'tournament' && (
          <Field label="Tournament Name" className="mt-4">
            <input
              type="text"
              value={round.tournamentName ?? ''}
              onChange={(e) => updateActiveRound({ tournamentName: e.target.value })}
              placeholder="e.g. AJGA Preview Series"
              className="input-field"
            />
          </Field>
        )}
      </section>

      <section className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-fairway-800">Course Hole Setup</p>
        <p className="mb-3 text-xs text-fairway-400">
          Enter par and yardage for each hole before starting.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Handicap">
            <input
              type="text"
              inputMode="decimal"
              value={round.courseHandicap}
              onChange={(e) => updateActiveRound({ courseHandicap: e.target.value })}
              placeholder="e.g. 12"
              className="input-field"
            />
          </Field>
          <Field label="Slope">
            <input
              type="text"
              inputMode="numeric"
              value={round.slopeRating}
              onChange={(e) => updateActiveRound({ slopeRating: e.target.value })}
              placeholder="e.g. 130"
              className="input-field"
            />
          </Field>
        </div>

        <div className="mb-2 grid grid-cols-[3.25rem_1fr_1fr] gap-2 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-fairway-400">
          <span>Hole</span>
          <span className="text-center">Par</span>
          <span className="text-center">Yards</span>
        </div>

        <div className="space-y-1.5">
          {round.holes.map((hole, index) => (
            <div
              key={hole.hole}
              className="grid grid-cols-[3.25rem_1fr_1fr] items-center gap-2"
            >
              <span className="text-sm font-bold text-fairway-800">Hole {hole.hole}</span>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={hole.par ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const par = value === '' ? '' : Number(value);
                    clearParError(hole.hole);
                    updateHoleLayout(index, { par, yards: hole.yards });
                  }}
                  onBlur={() => handleParBlur(hole.hole, hole.par)}
                  aria-invalid={parErrors[hole.hole] ? true : undefined}
                  className={`hole-setup-input${parErrors[hole.hole] ? ' border-red-500' : ''}`}
                />
                {parErrors[hole.hole] && (
                  <p className="mt-0.5 text-[10px] leading-tight text-red-600">
                    {parErrors[hole.hole]}
                  </p>
                )}
              </div>
              <input
                type="number"
                min={0}
                max={700}
                value={hole.yards === 0 ? '' : hole.yards}
                onChange={(e) =>
                  updateHoleLayout(index, { par: hole.par, yards: parseYardsInput(e.target.value) })
                }
                className="hole-setup-input"
              />
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-sand bg-cream px-3 py-2.5">
          <p className="text-sm font-bold text-fairway-800">TOTAL:</p>
          <p className="mt-1 text-sm text-fairway-700">
            Total Par: <span className="font-bold text-fairway-800">{totalPar}</span>
          </p>
          <p className="text-sm text-fairway-700">
            Total Yards: <span className="font-bold text-fairway-800">{totalYards}</span>
          </p>
        </div>
      </section>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handlePrimary}
          disabled={primaryDisabled}
          className="btn-primary w-full disabled:opacity-40"
        >
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button type="button" onClick={handleSecondary} className="btn-secondary w-full">
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-fairway-800">{label}</label>
      {children}
    </div>
  );
}
