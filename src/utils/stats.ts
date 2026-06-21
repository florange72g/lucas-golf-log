import type { HoleEntry, Round } from '../types';
import { isFairwayHit, isHoleLogged, isTournamentRound, normalizeMental } from '../types';
import { parAsNumber } from './parInput';

export function calcTotalScore(holes: HoleEntry[]): number {
  return holes.reduce((sum, h) => sum + h.score, 0);
}

export function calcTotalPar(holes: HoleEntry[]): number {
  return holes.reduce((sum, h) => sum + parAsNumber(h.par), 0);
}

export function scoreToPar(holes: HoleEntry[]): number {
  return calcTotalScore(holes) - calcTotalPar(holes);
}

export function formatScoreToPar(value: number): string {
  if (value === 0) return 'E';
  return value > 0 ? `+${value}` : `${value}`;
}

export function countFairways(holes: HoleEntry[]): {
  hit: number;
  left: number;
  right: number;
  total: number;
} {
  const fairwayHoles = holes.filter((h) => typeof h.par === 'number' && h.par >= 4);
  const applicable = fairwayHoles.filter((h) => h.fairway !== 'N/A' && h.fairway !== '');
  const hit = applicable.filter((h) => isFairwayHit(h.fairway)).length;
  const left = applicable.filter((h) => h.fairway === 'Left').length;
  const right = applicable.filter((h) => h.fairway === 'Right').length;
  return { hit, left, right, total: applicable.length || fairwayHoles.length };
}

export function countGIR(holes: HoleEntry[]): { hit: number; miss: number; total: number } {
  const logged = holes.filter((h) => h.gir === 'Hit' || h.gir === 'Miss');
  const hit = logged.filter((h) => h.gir === 'Hit').length;
  const miss = logged.filter((h) => h.gir === 'Miss').length;
  return { hit, miss, total: logged.length || holes.length };
}

export function countPutts(holes: HoleEntry[]): { one: number; two: number; three: number } {
  const logged = holes.filter((h) => isHoleLogged(h) && h.putts >= 0);
  return {
    one: logged.filter((h) => h.putts === 1).length,
    two: logged.filter((h) => h.putts === 2).length,
    three: logged.filter((h) => h.putts === 3).length,
  };
}

export function totalPutts(holes: HoleEntry[]): number {
  return holes
    .filter((h) => isHoleLogged(h) && h.putts >= 0)
    .reduce((sum, h) => sum + h.putts, 0);
}

export function avgPuttsPerHole(holes: HoleEntry[]): number {
  const logged = holes.filter((h) => isHoleLogged(h) && h.putts >= 0);
  if (logged.length === 0) return 0;
  const total = logged.reduce((sum, h) => sum + h.putts, 0);
  return Math.round((total / logged.length) * 10) / 10;
}

export function avgPuttsPerRound(rounds: Round[]): number {
  const completed = completedRounds(rounds);
  if (completed.length === 0) return 0;
  const roundTotals = completed.map((r) => totalPutts(r.holes)).filter((t) => t > 0);
  if (roundTotals.length === 0) return 0;
  return Math.round((roundTotals.reduce((a, b) => a + b, 0) / roundTotals.length) * 10) / 10;
}

export function frontNine(holes: HoleEntry[]): HoleEntry[] {
  return holes.slice(0, 9);
}

export function backNine(holes: HoleEntry[]): HoleEntry[] {
  return holes.slice(9, 18);
}

export function nineScore(holes: HoleEntry[]): number {
  return calcTotalScore(holes);
}

export function avgMentalScore(round: Round): number {
  const { focus, confidence, emotionalControl, courseManagement } = normalizeMental(round.mental);
  return Math.round(((focus + confidence + emotionalControl + courseManagement) / 4) * 10) / 10;
}

export function completedRounds(rounds: Round[]): Round[] {
  return rounds.filter((r) => r.completed);
}

export function formatScoringAverage(value: number): string {
  if (!value) return '—';
  return value.toFixed(1);
}

export function parScoringAverages(holes: HoleEntry[]): { par3: number; par4: number; par5: number } {
  const totals = {
    3: { score: 0, count: 0 },
    4: { score: 0, count: 0 },
    5: { score: 0, count: 0 },
  };

  holes.forEach((h) => {
    if (!isHoleLogged(h)) return;
    if (typeof h.par === 'number' && (h.par === 3 || h.par === 4 || h.par === 5)) {
      totals[h.par].score += h.score;
      totals[h.par].count += 1;
    }
  });

  const avg = (par: 3 | 4 | 5) => {
    const { score, count } = totals[par];
    return count ? Math.round((score / count) * 10) / 10 : 0;
  };

  return { par3: avg(3), par4: avg(4), par5: avg(5) };
}

export function roundTrends(rounds: Round[], limit = 10) {
  return completedRounds(rounds)
    .slice(0, limit)
    .reverse()
    .map((r) => {
      const fw = countFairways(r.holes);
      const gir = countGIR(r.holes);
      return {
        id: r.id,
        label: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: calcTotalScore(r.holes),
        fairwayPct: fw.total ? Math.round((fw.hit / fw.total) * 100) : 0,
        girPct: gir.total ? Math.round((gir.hit / gir.total) * 100) : 0,
        putts: totalPutts(r.holes),
      };
    });
}

export function tournamentCompletedRounds(rounds: Round[]): Round[] {
  return completedRounds(rounds).filter(isTournamentRound);
}

export function lastTournamentScores(rounds: Round[], limit = 10): number[] {
  return tournamentCompletedRounds(rounds)
    .slice(0, limit)
    .map((r) => calcTotalScore(r.holes));
}

export function roundStats(rounds: Round[]) {
  const completed = completedRounds(rounds);
  if (completed.length === 0) {
    return {
      roundsPlayed: 0,
      avgScore: 0,
      bestScore: 0,
      worstScore: 0,
      avgToPar: 0,
      fairwayPct: 0,
      fairwayOpportunities: 0,
      fairwaysHit: 0,
      fairwaysLeft: 0,
      fairwaysRight: 0,
      girPct: 0,
      girHit: 0,
      girMiss: 0,
      avgPutts: 0,
      puttsOne: 0,
      puttsTwo: 0,
      puttsThree: 0,
      avgMental: 0,
      tournamentRounds: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      doubleBogeys: 0,
      triplePlus: 0,
      doublesPlus: 0,
      par3Avg: 0,
      par4Avg: 0,
      par5Avg: 0,
      birdiesPerRound: 0,
    };
  }

  const scores = completed.map((r) => calcTotalScore(r.holes));
  const toPars = completed.map((r) => scoreToPar(r.holes));

  let totalFairways = 0;
  let totalFairwaysLeft = 0;
  let totalFairwaysRight = 0;
  let totalFairwayOpps = 0;
  let totalGIR = 0;
  let totalGIRMiss = 0;
  let totalGIROpps = 0;
  let puttsOne = 0;
  let puttsTwo = 0;
  let puttsThree = 0;
  const parTotals = {
    3: { score: 0, count: 0 },
    4: { score: 0, count: 0 },
    5: { score: 0, count: 0 },
  };
  const scoring = {
    birdies: 0,
    pars: 0,
    bogeys: 0,
    doubleBogeys: 0,
    triplePlus: 0,
  };

  completed.forEach((r) => {
    const fw = countFairways(r.holes);
    totalFairways += fw.hit;
    totalFairwaysLeft += fw.left;
    totalFairwaysRight += fw.right;
    totalFairwayOpps += fw.total;
    const gir = countGIR(r.holes);
    totalGIR += gir.hit;
    totalGIRMiss += gir.miss;
    totalGIROpps += gir.total;

    const putts = countPutts(r.holes);
    puttsOne += putts.one;
    puttsTwo += putts.two;
    puttsThree += putts.three;

    r.holes.forEach((h) => {
      if (typeof h.par !== 'number') return;
      if (isHoleLogged(h) && (h.par === 3 || h.par === 4 || h.par === 5)) {
        parTotals[h.par].score += h.score;
        parTotals[h.par].count += 1;
      }
      const diff = h.score - h.par;
      if (diff <= -1) scoring.birdies++;
      else if (diff === 0) scoring.pars++;
      else if (diff === 1) scoring.bogeys++;
      else if (diff === 2) scoring.doubleBogeys++;
      else scoring.triplePlus++;
    });
  });

  const parAvg = (par: 3 | 4 | 5) => {
    const { score, count } = parTotals[par];
    return count ? Math.round((score / count) * 10) / 10 : 0;
  };

  return {
    roundsPlayed: completed.length,
    avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    bestScore: Math.min(...scores),
    worstScore: Math.max(...scores),
    avgToPar: Math.round((toPars.reduce((a, b) => a + b, 0) / toPars.length) * 10) / 10,
    fairwayPct: totalFairwayOpps ? Math.round((totalFairways / totalFairwayOpps) * 100) : 0,
    fairwayOpportunities: totalFairwayOpps,
    fairwaysHit: totalFairways,
    fairwaysLeft: totalFairwaysLeft,
    fairwaysRight: totalFairwaysRight,
    girPct: totalGIROpps ? Math.round((totalGIR / totalGIROpps) * 100) : 0,
    girHit: totalGIR,
    girMiss: totalGIRMiss,
    avgPutts: avgPuttsPerRound(completed),
    puttsOne,
    puttsTwo,
    puttsThree,
    avgMental: Math.round(
      (completed.reduce((sum, r) => sum + avgMentalScore(r), 0) / completed.length) * 10
    ) / 10,
    tournamentRounds: completed.filter(isTournamentRound).length,
    birdiesPerRound: completed.length
      ? Math.round((scoring.birdies / completed.length) * 10) / 10
      : 0,
    par3Avg: parAvg(3),
    par4Avg: parAvg(4),
    par5Avg: parAvg(5),
    doublesPlus: scoring.doubleBogeys + scoring.triplePlus,
    ...scoring,
  };
}

export function mentalCategoryAverages(rounds: Round[]) {
  const completed = completedRounds(rounds);
  if (completed.length === 0) {
    return {
      focus: 0,
      confidence: 0,
      emotionalControl: 0,
      courseManagement: 0,
    };
  }

  const totals = { focus: 0, confidence: 0, emotionalControl: 0, courseManagement: 0 };
  completed.forEach((r) => {
    const m = normalizeMental(r.mental);
    totals.focus += m.focus;
    totals.confidence += m.confidence;
    totals.emotionalControl += m.emotionalControl;
    totals.courseManagement += m.courseManagement;
  });

  const n = completed.length;
  return {
    focus: Math.round((totals.focus / n) * 10) / 10,
    confidence: Math.round((totals.confidence / n) * 10) / 10,
    emotionalControl: Math.round((totals.emotionalControl / n) * 10) / 10,
    courseManagement: Math.round((totals.courseManagement / n) * 10) / 10,
  };
}

export function scoreDistribution(holes: HoleEntry[]) {
  let birdies = 0;
  let pars = 0;
  let bogeys = 0;
  let doubles = 0;
  let others = 0;

  holes.forEach((h) => {
    if (typeof h.par !== 'number') return;
    const diff = h.score - h.par;
    if (diff <= -1) birdies++;
    else if (diff === 0) pars++;
    else if (diff === 1) bogeys++;
    else if (diff === 2) doubles++;
    else others++;
  });

  return { birdies, pars, bogeys, doubles, others };
}
