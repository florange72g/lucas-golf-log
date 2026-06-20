import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useGolf } from '../context/GolfContext';
import { ROUND_TYPES, type RoundType } from '../types';

const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Windy', 'Rain', 'Cold', 'Hot'] as const;

export default function NewRound() {
  const navigate = useNavigate();
  const { activeRound, startNewRound, updateActiveRound, saveActiveRound } = useGolf();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!activeRound) startNewRound();
  }, [activeRound, startNewRound]);

  useEffect(() => {
    if (!activeRound) return;
    if (!['practice', 'tournament', 'all-18'].includes(activeRound.roundType)) {
      updateActiveRound({ roundType: 'practice' });
    }
  }, [activeRound, updateActiveRound]);

  if (!activeRound) return null;

  const round = activeRound;

  const handleStart = () => {
    if (!round.courseName.trim()) return;
    saveActiveRound();
    navigate('/hole-entry');
  };

  const setRoundType = (roundType: RoundType) => {
    updateActiveRound({
      roundType,
      tournamentName: roundType === 'tournament' ? round.tournamentName : undefined,
    });
  };

  return (
    <>
      <PageHeader title="Round Setup" subtitle="Configure your round" backTo="/" />

      <div className="space-y-4 px-4 pt-1 pb-6">
        <section className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
          <Field label="Course Name">
            <input
              type="text"
              value={round.courseName}
              onChange={(e) => updateActiveRound({ courseName: e.target.value })}
              placeholder="e.g. Pine Valley GC"
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

        <button
          type="button"
          onClick={handleStart}
          disabled={!round.courseName.trim()}
          className="btn-primary w-full disabled:opacity-40"
        >
          Start Hole Entry
        </button>
      </div>
    </>
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
