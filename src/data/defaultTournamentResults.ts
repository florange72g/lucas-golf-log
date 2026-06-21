import type { TournamentResult } from '../types';

const REMOVED_TOURNAMENT_IDS = new Set([
  'nb3-qc-bromont-2025',
  'nb3-ottawa-greensmere-2025',
  'nb3-jgnc-regional-final',
]);

export const DEFAULT_TOURNAMENT_RESULTS: TournamentResult[] = [
  {
    id: 'us-junior-am-ny-qual-2025',
    name: '77th U.S. Junior Amateur Championship Qualification — New York State',
    finish: '1st',
    scores: '68',
    url: 'https://playnysga.golfgenius.com/pages/5291951',
  },
  {
    id: 'us-junior-am-2025',
    name: '77th U.S. Junior Amateur Championship',
    finish: '',
    scores: '78, 84',
    url: 'https://championships.usga.org/usjunioramateur/2025/scoring.html',
  },
  {
    id: 'cjga-world-junior-2024',
    name: 'CJGA World Junior Challenge 2024',
    finish: 'T8',
    scores: '76, 80',
    url: 'https://cjga.onpar.golf/tournament_results.php?tournament_id=2707&s_division=262',
  },
  {
    id: 'qc-juvenile-2025',
    name: 'Quebec Provincial Juvenile Championship 2025',
    finish: 'T10',
    scores: '74, 78, 77, 75',
    url: 'https://gc-golfqubecschedules.golfgenius.com/pages/11097893628939389273',
  },
  {
    id: 'jpt-quebec-le-portage',
    name: 'JPT Quebec Championship at Le Portage',
    finish: '8th',
    scores: '78, 79, 73',
    url: 'https://www.golfgenius.com/pages/11286216147029988757',
  },
  {
    id: 'hjgt-pga-national-fall',
    name: 'HJGT PGA National Fall Junior Open',
    finish: '1st',
    scores: '39, 73',
    url: 'https://tournaments.hjgt.org/Scoreboard?TournamentID=29752&TournamentDivisionID=138041&IsCombinedDivision=False',
  },
  {
    id: 'hjgt-disney-fall',
    name: 'HJGT Disney Fall Junior Open',
    finish: '1st',
    scores: '75',
    url: 'https://tournaments.hjgt.org/Scoreboard?TournamentID=29777&TournamentDivisionID=138189&IsCombinedDivision=False',
  },
  {
    id: 'optimist-toc-2025',
    name: '2025 Optimist Tournament of Champions',
    finish: 'T14',
    scores: '85, 73',
    url: 'https://optimist.shotstat.com/Scoreboard?TournamentID=32150&TournamentDivisionID=146549&IsCombinedDivision=False',
  },
  {
    id: 'hjgt-orlando-54',
    name: 'HJGT 54-Hole Orlando Junior Open',
    finish: '1st',
    scores: '69, 87, 74',
    url: 'https://tournaments.hjgt.org/Scoreboard?TournamentID=32132&TournamentDivisionID=146453&IsCombinedDivision=False',
  },
  {
    id: 'fjt-ibis-landing',
    name: 'Florida Junior Tour Ibis Landing Open',
    finish: 'T3',
    scores: '72, 72',
    url: 'https://www.fsga.org/tournament/resultsfileview/865f0511-f67c-4f74-8e50-ac1e7c36ccc5/?fileId=52366',
  },
  {
    id: 'fjt-heritage-oaks',
    name: 'Florida Junior Tour Heritage Oaks Open',
    finish: 'T3',
    scores: '73, 72',
    url: 'https://www.fsga.org/tournament/resultsfileview/df542f74-faa8-4d92-bad8-b9b1e70b1d21/?fileId=52424',
  },
  {
    id: 'assante-classic-2026',
    name: '2026 Assante Classic Quebec — Overall Boys',
    finish: '3rd',
    scores: '71, 73',
    url: 'https://www.golfgenius.com/pages/12155775372243290392',
  },
];

export { REMOVED_TOURNAMENT_IDS };
