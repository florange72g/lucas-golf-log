import type { PlayerProfile, Round } from '../types';
import { DEFAULT_PROFILE } from '../types';
import { normalizeHole, normalizeMental, normalizeRoundType, serializeHole } from '../types';

const ROUNDS_KEY = 'golf-log-rounds';
const PROFILE_KEY = 'golf-log-profile';

const VALID_TEE_BOXES = ['Championship', 'Regular'] as const;

export function normalizeRoundHoles(round: Round): Round {
  return {
    ...round,
    holes: round.holes.map(normalizeHole),
  };
}

function normalizeRound(raw: Round & { tournament?: boolean }): Round {
  const roundType = normalizeRoundType(raw.roundType, raw.tournament);
  const teeBox = VALID_TEE_BOXES.includes(raw.teeBox as (typeof VALID_TEE_BOXES)[number])
    ? raw.teeBox
    : 'Championship';
  const { tournament: _, ...round } = raw;
  return {
    ...round,
    roundType,
    teeBox,
    courseHandicap: round.courseHandicap ?? '',
    slopeRating: round.slopeRating ?? '',
    mental: normalizeMental(round.mental),
    holes: round.holes.map(normalizeHole),
  };
}

function serializeRound(round: Round): Round {
  return {
    ...round,
    holes: round.holes.map(serializeHole),
  };
}

export function loadRounds(): Round[] {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY);
    return raw ? (JSON.parse(raw) as Round[]).map(normalizeRound) : [];
  } catch {
    return [];
  }
}

export function saveRounds(rounds: Round[]): void {
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds.map(serializeRound)));
}

export function normalizeProfile(raw: Partial<PlayerProfile>): PlayerProfile {
  return {
    name: raw.name ?? DEFAULT_PROFILE.name,
    gradYear: raw.gradYear ?? DEFAULT_PROFILE.gradYear,
    handicap: raw.handicap ?? DEFAULT_PROFILE.handicap,
    school: raw.school ?? '',
    email: raw.email ?? '',
    strength: raw.strength ?? DEFAULT_PROFILE.strength,
    developmentArea: raw.developmentArea ?? DEFAULT_PROFILE.developmentArea,
  };
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? normalizeProfile(JSON.parse(raw) as Partial<PlayerProfile>) : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// Re-export for consumers
export type { Hole, HoleEntry, Round } from '../types';
