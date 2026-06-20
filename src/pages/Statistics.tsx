import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import FairwayStats from '../components/FairwayStats';
import GIRStats from '../components/GIRStats';
import PuttsStats from '../components/PuttsStats';
import TrendChart from '../components/TrendChart';
import { useGolf } from '../context/GolfContext';
import { isTournamentRound } from '../types';
import {
  calcTotalScore,
  completedRounds,
  formatScoreToPar,
  formatScoringAverage,
  roundStats,
  roundTrends,
  scoreToPar,
} from '../utils/stats';

export default function Statistics() {
  const { rounds, profile } = useGolf();
  const stats = roundStats(rounds);
  const completed = completedRounds(rounds);
  const trends = roundTrends(rounds, 10);

  const scoringTotal =
    stats.birdies + stats.pars + stats.bogeys + stats.doubleBogeys + stats.triplePlus || 1;

  return (
    <>
      <PageHeader
        title="Statistics Dashboard"
        subtitle={`${profile.name.split(' ')[0]} · Season overview`}
        backTo="/"
      />

      <div className="space-y-5 px-4 pt-1 pb-8">
        {stats.roundsPlayed === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand py-16 text-center">
            <p className="text-lg font-semibold text-fairway-700">No rounds logged yet</p>
            <p className="mt-1 text-sm text-fairway-400">Complete a round to unlock your dashboard.</p>
            <Link to="/new-round" className="btn-primary mt-6 inline-block">
              Start a Round
            </Link>
          </div>
        ) : (
          <>
            {/* Overview */}
            <section className="rounded-2xl bg-gradient-to-br from-fairway-700 to-fairway-900 p-5 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">Overview</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <HeroStat label="Rounds Played" value={String(stats.roundsPlayed)} />
                <HeroStat label="Scoring Average" value={formatScoringAverage(stats.avgScore)} />
                <HeroStat label="Best Round" value={String(stats.bestScore)} highlight />
                <HeroStat label="Worst Round" value={String(stats.worstScore)} />
              </div>
            </section>

            {/* Fairways */}
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fairway-600">
                Fairway Percentage
              </h2>
              <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
                <FairwayStats
                  pct={stats.fairwayPct}
                  hit={stats.fairwaysHit}
                  left={stats.fairwaysLeft}
                  right={stats.fairwaysRight}
                />
              </div>
            </section>

            {/* GIR */}
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fairway-600">
                GIR Percentage
              </h2>
              <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
                <GIRStats pct={stats.girPct} hit={stats.girHit} miss={stats.girMiss} />
              </div>
            </section>

            {/* Putts */}
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fairway-600">
                Average Putts
              </h2>
              <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
                <PuttsStats
                  value={stats.avgPutts}
                  one={stats.puttsOne}
                  two={stats.puttsTwo}
                  three={stats.puttsThree}
                />
              </div>
            </section>

            {/* Scoring distribution */}
            <section className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-fairway-600">
                Scoring Distribution
              </h2>
              <div className="space-y-3">
                <DistBar label="Birdies" count={stats.birdies} total={scoringTotal} color="bg-fairway-600" />
                <DistBar label="Pars" count={stats.pars} total={scoringTotal} color="bg-fairway-400" />
                <DistBar label="Bogeys" count={stats.bogeys} total={scoringTotal} color="bg-orange-400" />
                <DistBar label="Double Bogeys" count={stats.doubleBogeys} total={scoringTotal} color="bg-red-400" />
                <DistBar label="Triple Bogeys+" count={stats.triplePlus} total={scoringTotal} color="bg-red-600" />
              </div>
            </section>

            {/* Par scoring */}
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fairway-600">
                Scoring by Par
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="Par 3 Avg"
                  value={stats.par3Avg ? stats.par3Avg.toFixed(1) : '—'}
                />
                <StatCard
                  label="Par 4 Avg"
                  value={stats.par4Avg ? stats.par4Avg.toFixed(1) : '—'}
                />
                <StatCard
                  label="Par 5 Avg"
                  value={stats.par5Avg ? stats.par5Avg.toFixed(1) : '—'}
                />
              </div>
            </section>

            {/* Trends */}
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fairway-600">
                Trends
              </h2>
              <div className="space-y-3">
                <TrendChart
                  title="Score"
                  data={trends.map((t) => ({ id: t.id, label: t.label, value: t.score }))}
                  referenceValue={stats.avgScore}
                  referenceLabel="Avg"
                />
                <TrendChart
                  title="Fairway %"
                  data={trends.map((t) => ({ id: t.id, label: t.label, value: t.fairwayPct }))}
                  referenceValue={stats.fairwayPct}
                  formatValue={(v) => `${v}%`}
                  barClass="bg-fairway-600"
                />
                <TrendChart
                  title="GIR %"
                  data={trends.map((t) => ({ id: t.id, label: t.label, value: t.girPct }))}
                  referenceValue={stats.girPct}
                  formatValue={(v) => `${v}%`}
                  barClass="bg-fairway-400"
                />
                <TrendChart
                  title="Putts"
                  data={trends.map((t) => ({ id: t.id, label: t.label, value: t.putts }))}
                  referenceValue={stats.avgPutts}
                  formatValue={(v) => v.toFixed(0)}
                  barClass="bg-gold-500"
                />
              </div>
            </section>

            {/* Round history */}
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fairway-600">
                Round History
              </h2>
              <div className="space-y-2">
                {completed.map((round) => (
                  <Link
                    key={round.id}
                    to={`/round-summary/${round.id}`}
                    className="flex items-center justify-between rounded-xl border border-sand bg-white px-4 py-3 shadow-sm transition active:bg-fairway-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fairway-800">{round.courseName}</p>
                      <p className="text-xs text-fairway-400">
                        {new Date(round.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {isTournamentRound(round) && ' · Tournament'}
                      </p>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <p className="text-xl font-bold tabular-nums text-fairway-800">
                        {calcTotalScore(round.holes)}
                      </p>
                      <p className="text-xs font-medium text-fairway-500">
                        {formatScoreToPar(scoreToPar(round.holes))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function HeroStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-fairway-800/60 px-3 py-4 text-center">
      <p className={`text-3xl font-bold tabular-nums ${highlight ? 'text-gold-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-wide text-fairway-300">
        {label}
      </p>
    </div>
  );
}

function DistBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-fairway-700">{label}</span>
        <span className="tabular-nums text-fairway-500">
          {count} <span className="text-fairway-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-fairway-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
