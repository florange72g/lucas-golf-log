import type { PlayerProfile, Round } from '../types';
import { DEFAULT_PROFILE } from '../types';
import { DEFAULT_TOURNAMENT_RESULTS, REMOVED_TOURNAMENT_IDS } from '../data/defaultTournamentResults';
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

export function normalizeRound(raw: Round & { tournament?: boolean }): Round {
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
    location: round.location ?? '',
    mental: normalizeMental(round.mental),
    holes: round.holes.map(normalizeHole),
  };
}

export function serializeRound(round: Round): Round {
  return {
    ...round,
    holes: round.holes.map(serializeHole),
  };
}

export function loadRoundsCache(): Round[] {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY);
    return raw ? (JSON.parse(raw) as Round[]).map(normalizeRound) : [];
  } catch {
    return [];
  }
}

export function saveRoundsCache(rounds: Round[]): void {
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds.map(serializeRound)));
}

/** @deprecated Use loadRoundsCache — localStorage is cache only when Supabase is configured. */
export const loadRounds = loadRoundsCache;

/** @deprecated Use saveRoundsCache — localStorage is cache only when Supabase is configured. */
export const saveRounds = saveRoundsCache;

export function normalizeProfile(raw: Partial<PlayerProfile>): PlayerProfile {
  const tournamentResults = Array.isArray(raw.tournamentResults)
    ? raw.tournamentResults
        .map((result) => ({
          id: result.id ?? crypto.randomUUID(),
          name: result.name?.trim() ?? '',
          finish: result.finish?.trim() ?? '',
          scores: result.scores?.trim() ?? '',
          url: result.url?.trim() ?? '',
        }))
        .filter((result) => !REMOVED_TOURNAMENT_IDS.has(result.id))
    : DEFAULT_TOURNAMENT_RESULTS;

  return {
    name: raw.name ?? DEFAULT_PROFILE.name,
    gradYear: raw.gradYear ?? DEFAULT_PROFILE.gradYear,
    handicap: raw.handicap ?? DEFAULT_PROFILE.handicap,
    school: raw.school ?? '',
    email: raw.email ?? '',
    coach: raw.coach ?? '',
    strength: raw.strength ?? DEFAULT_PROFILE.strength,
    developmentArea: raw.developmentArea ?? DEFAULT_PROFILE.developmentArea,
    tournamentResults,
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

/** @deprecated Use loadProfileCache — localStorage is cache only when Supabase is configured. */
export const loadProfileCache = loadProfile;

/** @deprecated Use saveProfileCache — localStorage is cache only when Supabase is configured. */
export const saveProfileCache = saveProfile;

// Re-export for consumers
export type { Hole, HoleEntry, Round } from '../types';
