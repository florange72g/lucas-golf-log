export const DRIVER_CLUBS = ['Driver', '3W', '5W', 'Hybrid', '4i', 'Other'] as const;

export const IRON_WOOD_CLUBS = [
  '3W', '5W', 'Hybrid', '4i', '5i', '6i', '7i', '8i', '9i',
  'PW', 'GW', 'SW', 'LW', 'Putter', 'Other',
] as const;

/** @deprecated Use IRON_WOOD_CLUBS */
export const APPROACH_CLUBS = IRON_WOOD_CLUBS;

import type { ParValue } from '../utils/parInput';
import type { YardsValue } from '../utils/yardsInput';

export interface Hole {
  hole: number;
  par: ParValue;
  yards: YardsValue;
  driver: string;
  fairway: 'Hit' | 'Left' | 'Right' | 'Hit Left' | 'Hit Right' | 'N/A';
  gir: 'Hit' | 'Miss' | 'N/A';
  iron1: string;
  iron2: string;
  putts: number;
  score: number;
  notes: string;
}

/** In-progress hole entry — fairway/gir unset until logged */
export type HoleEntry = Omit<Hole, 'fairway' | 'gir'> & {
  fairway: Hole['fairway'] | '';
  gir: Hole['gir'] | '';
};

/** @deprecated Use Hole or HoleEntry */
export type HoleData = HoleEntry;

type LegacyHole = Partial<HoleEntry> & {
  ironWood1?: string;
  ironWood2?: string;
  putting?: number | null;
};

export function normalizeFairway(value?: string): HoleEntry['fairway'] {
  if (
    value === 'Hit' ||
    value === 'Left' ||
    value === 'Right' ||
    value === 'Hit Left' ||
    value === 'Hit Right' ||
    value === 'N/A'
  ) {
    return value;
  }
  if (value?.toLowerCase() === 'hit left' || value === 'Hit-Left') return 'Hit Left';
  if (value?.toLowerCase() === 'hit right' || value === 'Hit-Right') return 'Hit Right';
  if (value?.toLowerCase() === 'hit') return 'Hit';
  if (value?.toLowerCase() === 'left') return 'Left';
  if (value?.toLowerCase() === 'right') return 'Right';
  if (value?.toUpperCase() === 'N/A' || value?.toLowerCase() === 'n/a') return 'N/A';
  return '';
}

export function isFairwayHit(value: HoleEntry['fairway']): boolean {
  return value === 'Hit' || value === 'Hit Left' || value === 'Hit Right';
}

export function isFairwayLeft(value: HoleEntry['fairway']): boolean {
  return value === 'Left' || value === 'Hit Left';
}

export function isFairwayRight(value: HoleEntry['fairway']): boolean {
  return value === 'Right' || value === 'Hit Right';
}

export function toggleFairwayHit(value: HoleEntry['fairway']): HoleEntry['fairway'] {
  if (value === 'N/A') return 'Hit';
  if (value === 'Hit') return '';
  if (value === 'Hit Left') return 'Left';
  if (value === 'Hit Right') return 'Right';
  if (value === 'Left') return 'Hit Left';
  if (value === 'Right') return 'Hit Right';
  return 'Hit';
}

export function toggleFairwayLeft(value: HoleEntry['fairway']): HoleEntry['fairway'] {
  if (value === 'N/A') return 'Left';
  if (value === 'Hit') return 'Hit Left';
  if (value === 'Hit Left') return 'Hit';
  if (value === 'Hit Right') return 'Hit Left';
  if (value === 'Left') return '';
  if (value === 'Right') return 'Left';
  return 'Left';
}

export function toggleFairwayRight(value: HoleEntry['fairway']): HoleEntry['fairway'] {
  if (value === 'N/A') return 'Right';
  if (value === 'Hit') return 'Hit Right';
  if (value === 'Hit Right') return 'Hit';
  if (value === 'Hit Left') return 'Hit Right';
  if (value === 'Right') return '';
  if (value === 'Left') return 'Right';
  return 'Right';
}

export function toggleFairwayNA(value: HoleEntry['fairway']): HoleEntry['fairway'] {
  return value === 'N/A' ? '' : 'N/A';
}

export function normalizeGIR(value?: string): HoleEntry['gir'] {
  if (value === 'Hit' || value === 'Miss' || value === 'N/A') return value;
  if (value?.toLowerCase() === 'hit') return 'Hit';
  if (value?.toLowerCase() === 'miss') return 'Miss';
  if (value?.toUpperCase() === 'N/A' || value?.toLowerCase() === 'n/a') return 'N/A';
  return '';
}

export function normalizeScore(value: number, par: ParValue): number {
  const parNum = typeof par === 'number' ? par : 4;
  if (Number.isNaN(value)) return Math.min(10, Math.max(1, parNum));
  return Math.min(10, Math.max(1, Math.round(value)));
}

export function normalizePutts(value?: number | null): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(4, Math.round(value)));
}

const LEGACY_DRIVER_MAP: Record<string, string> = {
  '2i': '4i',
  '3i': '4i',
};

export function normalizeClub(value: string | undefined, allowed: readonly string[]): string {
  if (!value) return '';
  if (allowed.includes(value)) return value;
  if (LEGACY_DRIVER_MAP[value]) return LEGACY_DRIVER_MAP[value];
  return 'Other';
}

export function normalizeHole(
  raw: LegacyHole & Pick<HoleEntry, 'hole' | 'par' | 'yards' | 'score'>,
): HoleEntry {
  return serializeHole({
    hole: raw.hole,
    par: raw.par,
    yards: raw.yards,
    driver: normalizeClub(raw.driver, DRIVER_CLUBS),
    fairway: normalizeFairway(raw.fairway),
    gir: normalizeGIR(raw.gir),
    iron1: normalizeClub(raw.iron1 ?? raw.ironWood1, IRON_WOOD_CLUBS),
    iron2: normalizeClub(raw.iron2 ?? raw.ironWood2, IRON_WOOD_CLUBS),
    putts: normalizePutts(raw.putts ?? raw.putting),
    score: normalizeScore(raw.score, raw.par),
    notes: raw.notes ?? '',
  });
}

export function serializeHole(hole: HoleEntry): HoleEntry {
  return {
    hole: hole.hole,
    par: hole.par,
    yards: hole.yards,
    driver: hole.driver,
    fairway: hole.fairway,
    gir: hole.gir,
    iron1: hole.iron1,
    iron2: hole.iron2,
    putts: normalizePutts(hole.putts),
    score: normalizeScore(hole.score, hole.par),
    notes: hole.notes,
  };
}

export interface MentalPerformance {
  focus: number;
  confidence: number;
  emotionalControl: number;
  courseManagement: number;
  highlightOfRound: string;
  keyLearning: string;
  practiceFocus: string;
}

export function normalizeMentalScore(value: unknown, fallback = 3): number {
  const n = typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
  if (n <= 5) return Math.min(5, Math.max(1, Math.round(n)));
  return Math.min(5, Math.max(1, Math.round(n / 2)));
}

type LegacyMental = Partial<MentalPerformance> & {
  bestShot?: string;
  biggestMistake?: string;
  nextPracticeFocus?: string;
  commitment?: number;
  preShotRoutine?: number;
  composure?: number;
  recoveryAfterBadHole?: number;
  notes?: string;
};

export function normalizeMental(raw: LegacyMental = {}): MentalPerformance {
  return {
    focus: normalizeMentalScore(raw.focus),
    confidence: normalizeMentalScore(raw.confidence),
    emotionalControl: normalizeMentalScore(raw.emotionalControl ?? raw.composure),
    courseManagement: normalizeMentalScore(raw.courseManagement ?? raw.recoveryAfterBadHole),
    highlightOfRound:
      typeof raw.highlightOfRound === 'string'
        ? raw.highlightOfRound
        : typeof raw.bestShot === 'string'
          ? raw.bestShot
          : '',
    keyLearning:
      typeof raw.keyLearning === 'string'
        ? raw.keyLearning
        : typeof raw.biggestMistake === 'string'
          ? raw.biggestMistake
          : '',
    practiceFocus:
      typeof raw.practiceFocus === 'string'
        ? raw.practiceFocus
        : typeof raw.nextPracticeFocus === 'string'
          ? raw.nextPracticeFocus
          : '',
  };
}

export interface CoachReflection {
  strengths: string;
  improvements: string;
  practiceFocus: string;
  goals: string;
}

export type RoundType = 'practice' | 'tournament' | 'all-18';

export const ROUND_TYPES: { value: RoundType; label: string; description: string }[] = [
  { value: 'practice', label: 'Practice', description: 'Casual or training round' },
  { value: 'tournament', label: 'Tournament', description: 'Competitive event' },
  { value: 'all-18', label: 'All 18 Holes', description: 'Full 18-hole round' },
];

export function normalizeRoundType(raw?: string, legacyTournament?: boolean): RoundType {
  if (raw === 'practice' || raw === 'tournament' || raw === 'all-18') return raw;
  if (legacyTournament) return 'tournament';
  return 'practice';
}

export interface Round {
  id: string;
  courseName: string;
  location: string;
  date: string;
  teeBox: string;
  weather: string;
  roundType: RoundType;
  tournamentName?: string;
  courseHandicap: string;
  slopeRating: string;
  holes: HoleEntry[];
  mental: MentalPerformance;
  coach: CoachReflection;
  completed: boolean;
  /** False until the player taps Start Hole Entry on round setup. */
  holeEntryStarted?: boolean;
  /** When true (or undefined on completed rounds), edit/delete are blocked. */
  isLocked?: boolean;
  createdAt: string;
}

export interface SavedCourseHole {
  holeNumber: number;
  par: number;
  yardage: number;
}

export interface SavedCourse {
  id: string;
  courseName: string;
  location: string;
  totalHoles: number;
  holes: SavedCourseHole[];
  courseHandicap: string;
  slopeRating: string;
  createdAt: string;
  updatedAt: string;
}

export function isTournamentRound(round: Pick<Round, 'roundType'>): boolean {
  return round.roundType === 'tournament';
}

export interface TournamentResult {
  id: string;
  name: string;
  finish: string;
  scores: string;
  url: string;
}

export interface PlayerProfile {
  name: string;
  gradYear: number;
  handicap: number;
  school: string;
  gpa: string;
  sat: string;
  email: string;
  coach: string;
  strength: string;
  developmentArea: string;
  tournamentResults: TournamentResult[];
  /** ISO timestamp — used to pick the newest profile across devices. */
  updatedAt?: string;
}

export const DEFAULT_PROFILE: PlayerProfile = {
  name: 'Lucas Zhao',
  gradYear: 2028,
  handicap: -1,
  school: '',
  gpa: '',
  sat: '',
  email: '',
  coach: '',
  strength: 'Approach Play',
  developmentArea: 'Putting Inside 8 Feet',
  tournamentResults: [],
};

export function formatHandicap(value: number): string {
  if (value < 0) return `+${Math.abs(value).toFixed(1)}`;
  return value.toFixed(1);
}

export const DEFAULT_MENTAL: MentalPerformance = {
  focus: 3,
  confidence: 3,
  emotionalControl: 3,
  courseManagement: 3,
  highlightOfRound: '',
  keyLearning: '',
  practiceFocus: '',
};

export const DEFAULT_COACH: CoachReflection = {
  strengths: '',
  improvements: '',
  practiceFocus: '',
  goals: '',
};

export function createEmptyHole(index: number): HoleEntry {
  const par: number = 4;
  return {
    hole: index + 1,
    par,
    yards: '',
    driver: '',
    fairway: par === 3 ? 'N/A' : '',
    gir: '',
    iron1: '',
    iron2: '',
    putts: 0,
    score: par,
    notes: '',
  };
}

export function createEmptyRound(): Round {
  return {
    id: crypto.randomUUID(),
    courseName: '',
    date: new Date().toISOString().split('T')[0],
    teeBox: 'Championship',
    weather: 'Clear',
    roundType: 'practice',
    location: '',
    courseHandicap: '',
    slopeRating: '',
    holes: Array.from({ length: 18 }, (_, i) => createEmptyHole(i)),
    mental: { ...DEFAULT_MENTAL },
    coach: { ...DEFAULT_COACH },
    completed: false,
    holeEntryStarted: false,
    createdAt: new Date().toISOString(),
  };
}

export function isHoleLogged(hole: HoleEntry): boolean {
  return (
    hole.driver !== '' ||
    hole.fairway !== '' ||
    hole.gir !== '' ||
    hole.iron1 !== '' ||
    hole.iron2 !== '' ||
    hole.putts > 0 ||
    hole.notes !== '' ||
    hole.score !== hole.par
  );
}

/** True once hole entry has begun (or for legacy in-progress rounds already saved). */
export function hasStartedHoleEntry(
  round: Pick<Round, 'holeEntryStarted' | 'courseName' | 'holes' | 'completed'>,
): boolean {
  if (round.holeEntryStarted === true) return true;
  if (round.holeEntryStarted === false) return false;
  return !!round.courseName.trim() || round.holes.some(isHoleLogged);
}
