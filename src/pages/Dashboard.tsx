import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useGolf } from '../context/GolfContext';
import { isTournamentRound, formatHandicap } from '../types';
import { calcTotalScore, completedRounds, formatScoreToPar, formatScoringAverage, roundStats, scoreToPar } from '../utils/stats';

export default function Dashboard() {
  const { rounds, profile, activeRound } = useGolf();
  const stats = roundStats(rounds);
  const recent = completedRounds(rounds).slice(0, 3);

  return (
    <>
      <PageHeader
        title={`Welcome, ${profile.name.split(' ')[0]}`}
        subtitle={`Class of ${profile.gradYear} · ${formatHandicap(profile.handicap)} HCP`}
      />

      <div className="-mt-3 space-y-5 px-4">
        {activeRound && (
          <Link
            to="/hole-entry"
            className="block rounded-2xl border-2 border-gold-400 bg-gradient-to-br from-fairway-700 to-fairway-800 p-5 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">Round in Progress</p>
                <p className="mt-1 text-lg font-bold">
                  {activeRound.courseName || 'Untitled Course'}
                </p>
                <p className="text-sm text-fairway-200">
                  Score: {calcTotalScore(activeRound.holes)} ({formatScoreToPar(scoreToPar(activeRound.holes))})
                </p>
              </div>
              <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-fairway-900">
                Continue →
              </span>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Rounds Played" value={stats.roundsPlayed} accent />
          <StatCard label="Scoring Average" value={formatScoringAverage(stats.avgScore)} />
          <StatCard label="Best Round" value={stats.bestScore || '—'} />
          <StatCard label="Worst Round" value={stats.worstScore || '—'} />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-fairway-600">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/new-round" label="New Round" desc="Log a round" />
            <QuickAction to="/mental" label="Mental Game" desc="Rate mindset" />
            <QuickAction to="/coach" label="Coach Notes" desc="Reflection" />
            <QuickAction to="/statistics" label="Statistics" desc="View trends" />
          </div>
        </section>

        {recent.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fairway-600">Recent Rounds</h2>
            <div className="space-y-2">
              {recent.map((round) => (
                <Link
                  key={round.id}
                  to={`/round-summary/${round.id}`}
                  className="flex items-center justify-between rounded-xl border border-sand bg-white px-4 py-3 shadow-sm transition active:bg-fairway-50"
                >
                  <div>
                    <p className="font-semibold text-fairway-800">{round.courseName}</p>
                    <p className="text-xs text-fairway-400">
                      {new Date(round.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {isTournamentRound(round) && ' · Tournament'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-fairway-800">{calcTotalScore(round.holes)}</p>
                    <p className="text-xs font-medium text-fairway-500">
                      {formatScoreToPar(scoreToPar(round.holes))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function QuickAction({ to, label, desc }: { to: string; label: string; desc: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-sand bg-white p-4 shadow-sm transition active:bg-fairway-50"
    >
      <p className="font-semibold text-fairway-800">{label}</p>
      <p className="text-xs text-fairway-400">{desc}</p>
    </Link>
  );
}
