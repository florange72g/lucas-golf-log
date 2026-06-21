import { getSupabase, isSupabaseConfigured, logSupabaseStatus } from '../lib/supabase';
import type { PlayerProfile, Round, SavedCourse } from '../types';
import {
  loadSavedCoursesCache,
  saveSavedCoursesCache,
  seedSavedCoursesFromRounds,
} from './savedCourses';
import {
  loadProfileCache,
  loadRoundsCache,
  normalizeProfile,
  normalizeRound,
  saveProfileCache,
  saveRoundsCache,
  serializeRound,
} from './storage';
import { syncError, syncLog } from './syncLog';

type RoundRow = { id: string; data: Round; updated_at: string };
type SavedCourseRow = { id: string; data: SavedCourse; updated_at: string };
type ProfileRow = { id: string; data: PlayerProfile; updated_at: string };

const PROFILE_ROW_ID = 'default';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CloudBootstrapResult = {
  rounds: Round[];
  savedCourses: SavedCourse[];
  profile: PlayerProfile;
  source: 'supabase' | 'localStorage';
};

export { isSupabaseConfigured, logSupabaseStatus };

function ensureValidUuid(id: string): string {
  return UUID_RE.test(id) ? id : crypto.randomUUID();
}

function normalizeRoundForCloud(round: Round): Round {
  const serialized = serializeRound(round);
  const id = ensureValidUuid(serialized.id);
  return id === serialized.id ? serialized : { ...serialized, id };
}

function normalizeRoundsForCloud(rounds: Round[]): Round[] {
  return rounds.map(normalizeRoundForCloud);
}

function cacheProfile(profile: PlayerProfile, reason: string): void {
  saveProfileCache(profile);
  syncLog('Cached player profile to localStorage', { reason });
}

function roundUpdatedAt(round: Round): string {
  return round.createdAt ?? new Date().toISOString();
}

function courseUpdatedAt(course: SavedCourse): string {
  return course.updatedAt ?? course.createdAt ?? new Date().toISOString();
}

function cacheRounds(rounds: Round[], reason: string): void {
  saveRoundsCache(rounds);
  syncLog(`Cached ${rounds.length} round(s) to localStorage`, { reason });
}

function cacheSavedCourses(courses: SavedCourse[], reason: string): void {
  saveSavedCoursesCache(courses);
  syncLog(`Cached ${courses.length} saved course(s) to localStorage`, { reason });
}

export async function fetchRoundsFromCloud(): Promise<Round[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  syncLog('SELECT rounds from Supabase…');
  const { data, error } = await supabase
    .from('rounds')
    .select('id, data, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    syncError('SELECT rounds FAILED', error);
    throw error;
  }

  const rounds = ((data ?? []) as RoundRow[]).map((row) => normalizeRound(row.data));
  syncLog('SELECT rounds OK', { count: rounds.length, ids: rounds.map((r) => r.id) });
  return rounds;
}

export async function fetchSavedCoursesFromCloud(): Promise<SavedCourse[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  syncLog('SELECT saved_courses from Supabase…');
  const { data, error } = await supabase
    .from('saved_courses')
    .select('id, data, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    syncError('SELECT saved_courses FAILED', error);
    throw error;
  }

  const courses = ((data ?? []) as SavedCourseRow[]).map((row) => row.data);
  syncLog('SELECT saved_courses OK', { count: courses.length, ids: courses.map((c) => c.id) });
  return courses;
}

export async function fetchProfileFromCloud(): Promise<PlayerProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  syncLog('SELECT player_profile from Supabase…');
  const { data, error } = await supabase
    .from('player_profile')
    .select('id, data, updated_at')
    .eq('id', PROFILE_ROW_ID)
    .maybeSingle();

  if (error) {
    syncError('SELECT player_profile FAILED', error);
    throw error;
  }

  if (!data) {
    syncLog('SELECT player_profile OK', { count: 0 });
    return null;
  }

  const profile = normalizeProfile((data as ProfileRow).data);
  syncLog('SELECT player_profile OK', { name: profile.name });
  return profile;
}

export async function upsertRoundToCloud(round: Round): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const normalized = normalizeRoundForCloud(round);
  const row = {
    id: normalized.id,
    data: normalized,
    updated_at: new Date().toISOString(),
  };

  syncLog('UPSERT round to Supabase', { id: normalized.id, course: normalized.courseName || '(untitled)' });
  const { data, error } = await supabase.from('rounds').upsert(row, { onConflict: 'id' }).select('id');

  if (error) {
    syncError('UPSERT round FAILED', { id: normalized.id, error });
    throw error;
  }

  syncLog('UPSERT round OK', { id: normalized.id, rowsReturned: data?.length ?? 0 });
}

export async function upsertSavedCourseToCloud(course: SavedCourse): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const row = {
    id: course.id,
    data: course,
    updated_at: courseUpdatedAt(course),
  };

  syncLog('UPSERT saved_course to Supabase', { id: course.id, name: course.courseName });
  const { data, error } = await supabase
    .from('saved_courses')
    .upsert(row, { onConflict: 'id' })
    .select('id');

  if (error) {
    syncError('UPSERT saved_course FAILED', { id: course.id, error });
    throw error;
  }

  syncLog('UPSERT saved_course OK', { id: course.id, rowsReturned: data?.length ?? 0 });
}

export async function deleteSavedCourseFromCloud(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  syncLog('DELETE saved_course from Supabase', { id });
  const { error } = await supabase.from('saved_courses').delete().eq('id', id);
  if (error) {
    syncError('DELETE saved_course FAILED', { id, error });
    throw error;
  }
  syncLog('DELETE saved_course OK', { id });
}

export async function upsertProfileToCloud(profile: PlayerProfile): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const row = {
    id: PROFILE_ROW_ID,
    data: profile,
    updated_at: new Date().toISOString(),
  };

  syncLog('UPSERT player_profile to Supabase', { name: profile.name });
  const { data, error } = await supabase
    .from('player_profile')
    .upsert(row, { onConflict: 'id' })
    .select('id');

  if (error) {
    syncError('UPSERT player_profile FAILED', error);
    throw error;
  }

  syncLog('UPSERT player_profile OK', { rowsReturned: data?.length ?? 0 });
}

export async function upsertRoundsToCloud(rounds: Round[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || rounds.length === 0) return;

  const rows = normalizeRoundsForCloud(rounds).map((round) => ({
    id: round.id,
    data: round,
    updated_at: roundUpdatedAt(round),
  }));

  syncLog('UPSERT rounds batch to Supabase', { count: rows.length, ids: rows.map((r) => r.id) });
  const { data, error } = await supabase.from('rounds').upsert(rows, { onConflict: 'id' }).select('id');

  if (error) {
    syncError('UPSERT rounds batch FAILED', error);
    throw error;
  }

  syncLog('UPSERT rounds batch OK', { rowsReturned: data?.length ?? 0 });
}

export async function upsertSavedCoursesToCloud(courses: SavedCourse[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  if (courses.length > 0) {
    const rows = courses.map((course) => ({
      id: course.id,
      data: course,
      updated_at: courseUpdatedAt(course),
    }));

    syncLog('UPSERT saved_courses batch to Supabase', {
      count: rows.length,
      ids: rows.map((c) => c.id),
    });
    const { data, error } = await supabase
      .from('saved_courses')
      .upsert(rows, { onConflict: 'id' })
      .select('id');

    if (error) {
      syncError('UPSERT saved_courses batch FAILED', error);
      throw error;
    }

    syncLog('UPSERT saved_courses batch OK', { rowsReturned: data?.length ?? 0 });
  }

  const { data: existing, error: fetchError } = await supabase.from('saved_courses').select('id');
  if (fetchError) {
    syncError('SELECT saved_courses ids for prune FAILED', fetchError);
    throw fetchError;
  }

  const keepIds = new Set(courses.map((course) => course.id));
  const deleteIds = ((existing ?? []) as Pick<SavedCourseRow, 'id'>[])
    .map((row) => row.id)
    .filter((id) => !keepIds.has(id));

  if (deleteIds.length > 0) {
    syncLog('DELETE removed saved_courses from Supabase', { ids: deleteIds });
    const { error: deleteError } = await supabase.from('saved_courses').delete().in('id', deleteIds);
    if (deleteError) {
      syncError('DELETE saved_courses FAILED', deleteError);
      throw deleteError;
    }
  }
}

export async function deleteRoundFromCloud(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  syncLog('DELETE round from Supabase', { id });
  const { error } = await supabase.from('rounds').delete().eq('id', id);
  if (error) {
    syncError('DELETE round FAILED', { id, error });
    throw error;
  }
  syncLog('DELETE round OK', { id });
}

/** Load rounds: Supabase when configured, otherwise localStorage cache. */
export async function loadRoundsFromSource(): Promise<Round[]> {
  if (!isSupabaseConfigured()) {
    const cached = loadRoundsCache();
    syncLog('Loaded rounds from localStorage (no Supabase)', { count: cached.length });
    return cached;
  }

  const rounds = await fetchRoundsFromCloud();
  cacheRounds(rounds, 'after cloud fetch');
  return rounds;
}

/** Load saved courses: Supabase when configured, otherwise localStorage cache. */
export async function loadSavedCoursesFromSource(): Promise<SavedCourse[]> {
  if (!isSupabaseConfigured()) {
    const cached = loadSavedCoursesCache();
    syncLog('Loaded saved courses from localStorage (no Supabase)', { count: cached.length });
    return cached;
  }

  const courses = await fetchSavedCoursesFromCloud();
  cacheSavedCourses(courses, 'after cloud fetch');
  return courses;
}

function mergeLocalOnlyRounds(cloudRounds: Round[], localRounds: Round[]): Round[] {
  const cloudIds = new Set(cloudRounds.map((round) => round.id));
  const localOnly = localRounds.filter((round) => !cloudIds.has(round.id));
  if (localOnly.length === 0) return cloudRounds;
  syncLog('Found local-only rounds to upload', { ids: localOnly.map((r) => r.id) });
  return [...cloudRounds, ...localOnly];
}

function mergeSavedCoursesLists(cloudCourses: SavedCourse[], localCourses: SavedCourse[]): SavedCourse[] {
  const byKey = new Map<string, SavedCourse>();

  for (const course of cloudCourses) {
    byKey.set(course.courseName.trim().toLowerCase(), course);
  }

  for (const course of localCourses) {
    const key = course.courseName.trim().toLowerCase();
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, course);
      continue;
    }
    if (Date.parse(course.updatedAt) > Date.parse(existing.updatedAt)) {
      byKey.set(key, course);
    }
  }

  return [...byKey.values()].sort((a, b) => a.courseName.localeCompare(b.courseName));
}

export async function bootstrapFromCloud(): Promise<CloudBootstrapResult> {
  logSupabaseStatus();

  const localRounds = loadRoundsCache();
  const localCourses = loadSavedCoursesCache();
  const localProfile = loadProfileCache();
  const localSeededCourses = seedSavedCoursesFromRounds(localRounds, localCourses);

  if (!isSupabaseConfigured()) {
    return {
      rounds: localRounds,
      savedCourses: localSeededCourses,
      profile: localProfile,
      source: 'localStorage',
    };
  }

  syncLog('Bootstrap: loading from Supabase (source of truth)…');

  let cloudRounds = await fetchRoundsFromCloud();
  let cloudCourses = await fetchSavedCoursesFromCloud();
  let cloudProfile = await fetchProfileFromCloud().catch((error) => {
    syncError('Profile fetch failed during bootstrap — using local profile', error);
    return null;
  });

  const mergedRounds = normalizeRoundsForCloud(
    mergeLocalOnlyRounds(cloudRounds, localRounds),
  );
  const mergedCourses = mergeSavedCoursesLists(cloudCourses, localSeededCourses);
  const localOnlyCount = mergedRounds.length - cloudRounds.length;

  if (localOnlyCount > 0) {
    syncLog('Migrating local-only rounds to Supabase', { count: localOnlyCount });
  }

  try {
    const localOnlyRounds = mergedRounds.filter(
      (round) => !cloudRounds.some((cloudRound) => cloudRound.id === round.id),
    );
    if (localOnlyRounds.length > 0) {
      await upsertRoundsToCloud(localOnlyRounds);
      cloudRounds = await fetchRoundsFromCloud();
    }
  } catch (error) {
    syncError('Round migration upload failed — continuing with fetched cloud data', error);
  }

  try {
    if (cloudCourses.length === 0 && mergedCourses.length > 0) {
      await upsertSavedCoursesToCloud(mergedCourses);
      cloudCourses = await fetchSavedCoursesFromCloud();
    }
  } catch (error) {
    syncError('Saved course migration upload failed — continuing with fetched cloud data', error);
  }

  try {
    if (!cloudProfile) {
      await upsertProfileToCloud(localProfile);
      cloudProfile = await fetchProfileFromCloud();
    }
  } catch (error) {
    syncError('Profile migration upload failed — using local profile', error);
  }

  const savedCourses =
    cloudCourses.length > 0 ? cloudCourses : seedSavedCoursesFromRounds(cloudRounds, []);
  const profile = cloudProfile ?? localProfile;

  cacheRounds(cloudRounds, 'bootstrap complete');
  cacheSavedCourses(savedCourses, 'bootstrap complete');
  cacheProfile(profile, 'bootstrap complete');

  syncLog('Bootstrap complete — using Supabase data', {
    rounds: cloudRounds.length,
    savedCourses: savedCourses.length,
    profile: profile.name,
  });

  return { rounds: cloudRounds, savedCourses, profile, source: 'supabase' };
}

/** Save one round to Supabase, refetch all rounds, update cache. */
export async function persistRound(round: Round): Promise<Round[]> {
  const serialized = normalizeRoundForCloud(round);

  if (!isSupabaseConfigured()) {
    const cached = loadRoundsCache();
    const idx = cached.findIndex((item) => item.id === serialized.id);
    const next =
      idx >= 0
        ? cached.map((item, index) => (index === idx ? serialized : item))
        : [serialized, ...cached];
    cacheRounds(next, 'persistRound offline');
    syncLog('Saved round to localStorage only (no Supabase)', { id: round.id });
    return next;
  }

  await upsertRoundToCloud(serialized);
  const fresh = await fetchRoundsFromCloud();
  cacheRounds(fresh, 'after persistRound');
  return fresh;
}

/** Save player profile to Supabase, refetch, update cache. */
export async function persistProfile(profile: PlayerProfile): Promise<PlayerProfile> {
  const normalized = normalizeProfile(profile);

  if (!isSupabaseConfigured()) {
    cacheProfile(normalized, 'persistProfile offline');
    syncLog('Saved profile to localStorage only (no Supabase)', { name: normalized.name });
    return normalized;
  }

  await upsertProfileToCloud(normalized);
  const fresh = (await fetchProfileFromCloud()) ?? normalized;
  cacheProfile(fresh, 'after persistProfile');
  return fresh;
}

/** Save all rounds to Supabase, refetch, update cache. */
export async function persistAllRounds(rounds: Round[]): Promise<Round[]> {
  if (!isSupabaseConfigured()) {
    cacheRounds(rounds.map(normalizeRoundForCloud), 'persistAllRounds offline');
    syncLog('Saved rounds to localStorage only (no Supabase)', { count: rounds.length });
    return rounds;
  }

  await upsertRoundsToCloud(rounds.map(normalizeRoundForCloud));
  const fresh = await fetchRoundsFromCloud();
  cacheRounds(fresh, 'after persistAllRounds');
  return fresh;
}

/** Save one saved course to Supabase, refetch all, update cache. */
export async function persistSavedCourse(course: SavedCourse): Promise<SavedCourse[]> {
  if (!isSupabaseConfigured()) {
    const cached = loadSavedCoursesCache();
    const idx = cached.findIndex((item) => item.id === course.id);
    const next =
      idx >= 0
        ? cached.map((item, index) => (index === idx ? course : item))
        : [...cached, course].sort((a, b) => a.courseName.localeCompare(b.courseName));
    cacheSavedCourses(next, 'persistSavedCourse offline');
    syncLog('Saved course to localStorage only (no Supabase)', { id: course.id });
    return next;
  }

  await upsertSavedCourseToCloud(course);
  const fresh = await fetchSavedCoursesFromCloud();
  cacheSavedCourses(fresh, 'after persistSavedCourse');
  return fresh;
}

/** Save saved courses to Supabase, refetch, update cache. */
export async function persistSavedCourses(courses: SavedCourse[]): Promise<SavedCourse[]> {
  if (!isSupabaseConfigured()) {
    cacheSavedCourses(courses, 'persistSavedCourses offline');
    syncLog('Saved courses to localStorage only (no Supabase)', { count: courses.length });
    return courses;
  }

  await upsertSavedCoursesToCloud(courses);
  const fresh = await fetchSavedCoursesFromCloud();
  cacheSavedCourses(fresh, 'after persistSavedCourses');
  return fresh;
}

/** Delete saved course from Supabase, refetch all, update cache. */
export async function removeSavedCourse(id: string): Promise<SavedCourse[]> {
  if (!isSupabaseConfigured()) {
    const next = loadSavedCoursesCache().filter((course) => course.id !== id);
    cacheSavedCourses(next, 'removeSavedCourse offline');
    return next;
  }

  await deleteSavedCourseFromCloud(id);
  const fresh = await fetchSavedCoursesFromCloud();
  cacheSavedCourses(fresh, 'after removeSavedCourse');
  return fresh;
}

/** Delete round from Supabase, refetch all, update cache. */
export async function removeRound(id: string): Promise<Round[]> {
  if (!isSupabaseConfigured()) {
    const next = loadRoundsCache().filter((round) => round.id !== id);
    cacheRounds(next, 'removeRound offline');
    return next;
  }

  await deleteRoundFromCloud(id);
  const fresh = await fetchRoundsFromCloud();
  cacheRounds(fresh, 'after removeRound');
  return fresh;
}

/** Refetch all data from Supabase (e.g. when app regains focus). */
export async function refreshFromCloud(): Promise<CloudBootstrapResult> {
  if (!isSupabaseConfigured()) {
    const localRounds = loadRoundsCache();
    const localCourses = seedSavedCoursesFromRounds(localRounds, loadSavedCoursesCache());
    return {
      rounds: localRounds,
      savedCourses: localCourses,
      profile: loadProfileCache(),
      source: 'localStorage',
    };
  }

  syncLog('Refreshing from Supabase…');
  const rounds = await fetchRoundsFromCloud();
  const savedCoursesRaw = await fetchSavedCoursesFromCloud();
  const savedCourses =
    savedCoursesRaw.length > 0 ? savedCoursesRaw : seedSavedCoursesFromRounds(rounds, []);
  const profile = (await fetchProfileFromCloud()) ?? loadProfileCache();
  cacheRounds(rounds, 'refresh');
  cacheSavedCourses(savedCourses, 'refresh');
  cacheProfile(profile, 'refresh');
  return { rounds, savedCourses, profile, source: 'supabase' };
}

// Legacy aliases used during refactor
export const pushRoundsAndRefresh = persistAllRounds;
export const pushSavedCoursesAndRefresh = persistSavedCourses;
