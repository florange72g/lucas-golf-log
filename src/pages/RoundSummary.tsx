import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import RoundLockControl from '../components/RoundLockControl';
import StatCard from '../components/StatCard';
import TodaysRoundSummary from '../components/TodaysRoundSummary';
import FairwayStats from '../components/FairwayStats';
import GIRStats from '../components/GIRStats';
import PuttsStats from '../components/PuttsStats';
import ScoreMarker from '../components/ScoreMarker';
import { useGolf } from '../context/GolfContext';
import type { HoleEntry } from '../types';
import { isTournamentRound } from '../types';
import { parAsNumber } from '../utils/parInput';
import { generateRoundPdf } from '../utils/generateGolfReportPdf';
import {
  avgMentalScore,
  countPutts,
  totalPutts,
  backNine,
  calcTotalScore,
  countFairways,
  countGIR,
  formatScoreToPar,
  frontNine,
  nineScore,
  scoreDistribution,
  scoreToPar,
} from '../utils/stats';

export default function RoundSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRound, rounds, profile, completeRound, saveActiveRound, setRoundLocked } = useGolf();
  const [exporting, setExporting] = useState(false);

  const round =
    id === 'active'
      ? activeRound
      : rounds.find((r) => r.id === id);

  if (!round) {
    return (
      <>
        <PageHeader title="Round Summary" backTo="/" />
        <div className="px-4 pt-8 text-center text-fairway-500">Round not found.</div>
      </>
    );
  }

  const total = calcTotalScore(round.holes);
  const toPar = scoreToPar(round.holes);
  const fw = countFairways(round.holes);
  const gir = countGIR(round.holes);
  const putts = countPutts(round.holes);
  const dist = scoreDistribution(round.holes);
  const isActive = id === 'active';
  const holesWithNotes = round.holes.filter((hole) => hole.notes.trim());

  const handleComplete = () => {
    saveActiveRound();
    completeRound();
    navigate('/');
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      if (isActive) saveActiveRound();
      await generateRoundPdf(profile, round);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Round Summary"
        subtitle={round.courseName}
        backTo={isActive ? '/hole-entry' : '/'}
        action={
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-fairway-900 disabled:opacity-60"
          >
            {exporting ? '…' : 'Export PDF'}
          </button>
        }
      />

      <div className="space-y-5 px-4 pt-2">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exporting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-fairway-700 bg-fairway-800 py-3.5 font-semibold text-white shadow-md disabled:opacity-60"
        >
          <svg className="h-5 w-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M6 18h12a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {exporting ? 'Generating PDF…' : 'Export PDF'}
        </button>
        <div className="rounded-2xl bg-gradient-to-br from-fairway-700 to-fairway-900 p-6 text-center text-white shadow-lg">
          <p className="text-sm font-medium text-fairway-200">
            {new Date(round.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {!isActive && round.completed && (
            <RoundLockControl
              round={round}
              onSetLocked={(locked) => setRoundLocked(round.id, locked)}
              className="mt-2 justify-center"
              variant="onDark"
            />
          )}
          {isTournamentRound(round) && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold-400">
              {round.tournamentName || 'Tournament'}
            </p>
          )}
          <p className="mt-3 text-6xl font-bold text-gold-400">{total}</p>
          <p className="text-xl font-semibold">{formatScoreToPar(toPar)}</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div>
              <p className="text-fairway-300">Front</p>
              <p className="text-lg font-bold">{nineScore(frontNine(round.holes))}</p>
            </div>
            <div>
              <p className="text-fairway-300">Back</p>
              <p className="text-lg font-bold">{nineScore(backNine(round.holes))}</p>
            </div>
          </div>
        </div>

        <TodaysRoundSummary
          score={total}
          toPar={toPar}
          coach={round.coach}
          showCoachLink={isActive}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
            <FairwayStats
              pct={fw.total ? Math.round((fw.hit / fw.total) * 100) : 0}
              hit={fw.hit}
              left={fw.left}
              right={fw.right}
            />
          </div>
          <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
            <GIRStats
              pct={gir.total ? Math.round((gir.hit / gir.total) * 100) : 0}
              hit={gir.hit}
              miss={gir.miss}
            />
          </div>
          <div className="col-span-2 rounded-2xl border border-sand bg-white p-4 shadow-sm">
            <PuttsStats
              label="Total Putts"
              value={totalPutts(round.holes)}
              sub="this round"
              one={putts.one}
              two={putts.two}
              three={putts.three}
            />
          </div>
          <StatCard label="Birdies" value={dist.birdies} />
          <StatCard label="Bogeys+" value={dist.bogeys + dist.doubles + dist.others} />
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-fairway-600">Scorecard</h2>
          <div className="overflow-x-auto rounded-xl border border-sand bg-white">
            <ScorecardRow holes={frontNine(round.holes)} label="Out" />
            <ScorecardRow holes={backNine(round.holes)} label="In" />
          </div>
        </section>

        {holesWithNotes.length > 0 && (
          <section className="rounded-xl border border-sand bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-fairway-600">Personal Notes</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {holesWithNotes.map((hole) => (
                <div key={hole.hole}>
                  <dt className="font-semibold text-fairway-700">Hole {hole.hole}</dt>
                  <dd className="mt-0.5 text-fairway-500">{hole.notes}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {(round.mental.highlightOfRound || round.mental.keyLearning || round.mental.practiceFocus) && (
          <section className="rounded-xl border border-sand bg-white p-4">
            <h3 className="text-sm font-bold text-fairway-700">Mental Performance</h3>
            <p className="mt-1 text-xs text-fairway-400">Overall: {avgMentalScore(round)}/5</p>
            <dl className="mt-3 space-y-2 text-sm">
              {round.mental.highlightOfRound && (
                <div>
                  <dt className="font-semibold text-fairway-600">Highlight of the Round</dt>
                  <dd className="text-fairway-500">{round.mental.highlightOfRound}</dd>
                </div>
              )}
              {round.mental.keyLearning && (
                <div>
                  <dt className="font-semibold text-fairway-600">Key Learning</dt>
                  <dd className="text-fairway-500">{round.mental.keyLearning}</dd>
                </div>
              )}
              {round.mental.practiceFocus && (
                <div>
                  <dt className="font-semibold text-fairway-600">Practice Focus</dt>
                  <dd className="text-fairway-500">{round.mental.practiceFocus}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          {isActive && (
            <>
              <Link to="/mental" className="btn-secondary text-center">
                Mental Game
              </Link>
              <Link to="/coach" className="btn-secondary text-center">
                Coach Notes
              </Link>
            </>
          )}
        </div>

        {isActive ? (
          <button type="button" onClick={handleComplete} className="btn-primary w-full">
            Save & Complete Round
          </button>
        ) : (
          <Link to="/recruiting" className="btn-primary block w-full text-center">
            View Recruiting Report
          </Link>
        )}
      </div>
    </>
  );
}

function ScorecardRow({ holes, label }: { holes: HoleEntry[]; label: string }) {
  const parTotal = holes.reduce((s, h) => s + parAsNumber(h.par), 0);
  const scoreTotal = holes.reduce((s, h) => s + h.score, 0);

  return (
    <table className="w-full min-w-[360px] text-center text-xs">
      <thead>
        <tr className="border-b border-sand bg-fairway-50">
          <th className="px-2 py-2 text-left font-semibold text-fairway-600">Hole</th>
          {holes.map((h) => (
            <th key={h.hole} className="px-1 py-2 font-medium text-fairway-400">{h.hole}</th>
          ))}
          <th className="px-2 py-2 font-bold text-fairway-700">{label}</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-sand">
          <td className="px-2 py-2 text-left font-medium text-fairway-500">Par</td>
          {holes.map((h) => (
            <td key={h.hole} className="px-1 py-2 text-fairway-400">{parAsNumber(h.par)}</td>
          ))}
          <td className="px-2 py-2 font-semibold">{parTotal}</td>
        </tr>
        <tr>
          <td className="px-2 py-2 text-left font-medium text-fairway-500">Score</td>
          {holes.map((h) => (
            <td key={h.hole} className="px-1 py-2">
              <ScoreMarker score={h.score} par={parAsNumber(h.par)} />
            </td>
          ))}
          <td className="px-2 py-2 font-bold text-fairway-800">{scoreTotal}</td>
        </tr>
      </tbody>
    </table>
  );
}
