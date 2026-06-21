import { getSupabase, isSupabaseConfigured, logSupabaseStatus } from '../lib/supabase';
import type { Round, SavedCourse } from '../types';
import {
  loadSavedCoursesCache,
  saveSavedCoursesCache,
  seedSavedCoursesFromRounds,
} from './savedCourses';
import { loadRoundsCache, normalizeRound, saveRoundsCache, serializeRound } from './storage';
import { syncError, syncLog } from './syncLog';

type RoundRow = { id: string; data: Round; updated_at: string };
type SavedCourseRow = { id: string; data: SavedCourse; updated_at: string };

export type CloudBootstrapResult = {
  rounds: Round[];
  savedCourses: SavedCourse[];
  source: 'supabase' | 'localStorage';
};

export { isSupabaseConfigured, logSupabaseStatus };

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

export async function upsertRoundToCloud(round: Round): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const row = {
    id: round.id,
    data: serializeRound(round),
    updated_at: new Date().toISOString(),
  };

  syncLog('UPSERT round to Supabase', { id: round.id, course: round.courseName || '(untitled)' });
  const { data, error } = await supabase.from('rounds').upsert(row, { onConflict: 'id' }).select('id');

  if (error) {
    syncError('UPSERT round FAILED', { id: round.id, error });
    throw error;
  }

  syncLog('UPSERT round OK', { id: round.id, rowsReturned: data?.length ?? 0 });
}

export async function upsertRoundsToCloud(rounds: Round[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || rounds.length === 0) return;

  const rows = rounds.map((round) => ({
    id: round.id,
    data: serializeRound(round),
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
  const localSeededCourses = seedSavedCoursesFromRounds(localRounds, localCourses);

  if (!isSupabaseConfigured()) {
    return {
      rounds: localRounds,
      savedCourses: localSeededCourses,
      source: 'localStorage',
    };
  }

  syncLog('Bootstrap: loading from Supabase (source of truth)…');

  let cloudRounds = await fetchRoundsFromCloud();
  let cloudCourses = await fetchSavedCoursesFromCloud();

  const mergedRounds = mergeLocalOnlyRounds(cloudRounds, localRounds);
  const mergedCourses = mergeSavedCoursesLists(cloudCourses, localSeededCourses);

  if (mergedRounds.length > 0) {
    await upsertRoundsToCloud(mergedRounds);
    cloudRounds = await fetchRoundsFromCloud();
  }

  if (mergedCourses.length > 0) {
    await upsertSavedCoursesToCloud(mergedCourses);
    cloudCourses = await fetchSavedCoursesFromCloud();
  }

  const savedCourses =
    cloudCourses.length > 0 ? cloudCourses : seedSavedCoursesFromRounds(cloudRounds, []);

  cacheRounds(cloudRounds, 'bootstrap complete');
  cacheSavedCourses(savedCourses, 'bootstrap complete');

  syncLog('Bootstrap complete — using Supabase data', {
    rounds: cloudRounds.length,
    savedCourses: savedCourses.length,
  });

  return { rounds: cloudRounds, savedCourses, source: 'supabase' };
}

/** Save one round to Supabase, refetch all rounds, update cache. */
export async function persistRound(round: Round): Promise<Round[]> {
  const serialized = serializeRound(round);

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

/** Save all rounds to Supabase, refetch, update cache. */
export async function persistAllRounds(rounds: Round[]): Promise<Round[]> {
  if (!isSupabaseConfigured()) {
    cacheRounds(rounds.map(serializeRound), 'persistAllRounds offline');
    syncLog('Saved rounds to localStorage only (no Supabase)', { count: rounds.length });
    return rounds;
  }

  await upsertRoundsToCloud(rounds.map(serializeRound));
  const fresh = await fetchRoundsFromCloud();
  cacheRounds(fresh, 'after persistAllRounds');
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
    return { rounds: localRounds, savedCourses: localCourses, source: 'localStorage' };
  }

  syncLog('Refreshing from Supabase…');
  const rounds = await fetchRoundsFromCloud();
  const savedCourses = await fetchSavedCoursesFromCloud();
  const courses =
    savedCourses.length > 0 ? savedCourses : seedSavedCoursesFromRounds(rounds, []);
  cacheRounds(rounds, 'refresh');
  cacheSavedCourses(courses, 'refresh');
  return { rounds, savedCourses: courses, source: 'supabase' };
}

// Legacy aliases used during refactor
export const pushRoundsAndRefresh = persistAllRounds;
export const pushSavedCoursesAndRefresh = persistSavedCourses;
