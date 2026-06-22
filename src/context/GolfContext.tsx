import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PlayerProfile, Round, SavedCourse } from '../types';
import { createEmptyRound, hasStartedHoleEntry } from '../types';
import {
  bootstrapFromCloudWithRetry,
  persistProfile,
  persistRound,
  persistSavedCourse,
  refreshFromCloud,
  removeRound,
  removeSavedCourse,
  type CloudBootstrapResult,
} from '../utils/cloudSync';
import {
  applySavedCourseToRound,
  loadSavedCoursesCache,
  normalizeCourseKey,
  seedSavedCoursesFromRounds,
  upsertSavedCourse,
} from '../utils/savedCourses';
import { isRoundLocked } from '../utils/roundLock';
import { formatSyncError } from '../utils/syncError';
import { syncError as logSyncError } from '../utils/syncLog';
import {
  loadProfileCache,
  loadRoundsCache,
  normalizeRoundHoles,
  saveProfileCache,
} from '../utils/storage';

const IN_PROGRESS_SYNC_MS = 1500;
const CLOUD_REFRESH_MS = 15_000;
const MOBILE_BOOTSTRAP_RETRY_MS = 3000;

function findInProgressRound(rounds: Round[]): Round | null {
  return rounds.find((round) => !round.completed && hasStartedHoleEntry(round)) ?? null;
}

function filterPersistedRounds(rounds: Round[]): Round[] {
  return rounds.filter((round) => round.completed || hasStartedHoleEntry(round));
}

function mergeRoundList(prev: Round[], normalized: Round): Round[] {
  const idx = prev.findIndex((r) => r.id === normalized.id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = normalized;
    return next;
  }
  return [normalized, ...prev];
}

function reconcileActiveRound(cloudRounds: Round[], previous: Round | null): Round | null {
  if (previous && !previous.completed) {
    return normalizeRoundHoles(previous);
  }

  const fromCloud = findInProgressRound(cloudRounds);
  if (fromCloud) return normalizeRoundHoles(fromCloud);

  return null;
}

function mergeCloudRoundsWithLocalActive(cloudRounds: Round[], localActive: Round | null): Round[] {
  if (localActive && !localActive.completed) {
    return mergeRoundList(cloudRounds, normalizeRoundHoles(localActive));
  }
  return cloudRounds;
}

function applyCloudResult(
  result: CloudBootstrapResult,
  localActive: Round | null,
  setRounds: (rounds: Round[]) => void,
  setSavedCourses: (courses: SavedCourse[]) => void,
  setProfileState: (profile: PlayerProfile) => void,
  setActiveRoundState: (round: Round | null) => void,
): void {
  const nextActive = reconcileActiveRound(result.rounds, localActive);
  setRounds(filterPersistedRounds(mergeCloudRoundsWithLocalActive(result.rounds, nextActive)));
  setSavedCourses(result.savedCourses);
  setProfileState(result.profile);
  setActiveRoundState(nextActive);
}

interface GolfContextValue {
  rounds: Round[];
  savedCourses: SavedCourse[];
  profile: PlayerProfile;
  activeRound: Round | null;
  editingSavedRound: boolean;
  syncReady: boolean;
  syncSource: 'supabase' | 'localStorage';
  lastSyncedAt: string | null;
  syncError: string | null;
  refreshNow: () => Promise<void>;
  setProfile: (profile: PlayerProfile) => void;
  startNewRound: () => Round;
  setActiveRound: (round: Round | null) => void;
  updateActiveRound: (updates: Partial<Round> | ((prev: Round) => Partial<Round>)) => void;
  applySavedCourse: (course: SavedCourse) => void;
  saveActiveRound: () => void;
  saveEditedRound: () => void;
  loadRoundForEdit: (id: string) => boolean;
  resumeRound: (id: string) => boolean;
  clearEditingRound: () => void;
  discardDraftRound: () => void;
  completeRound: () => void;
  deleteRound: (id: string) => void;
  deleteSavedCourse: (id: string) => void;
  setRoundLocked: (id: string, locked: boolean) => void;
}

const GolfContext = createContext<GolfContextValue | null>(null);

export function GolfProvider({ children }: { children: ReactNode }) {
  const [rounds, setRounds] = useState<Round[]>(() => loadRoundsCache());
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>(() =>
    seedSavedCoursesFromRounds(loadRoundsCache(), loadSavedCoursesCache()),
  );
  const [profile, setProfileState] = useState<PlayerProfile>(() => loadProfileCache());
  const [activeRound, setActiveRoundState] = useState<Round | null>(() =>
    findInProgressRound(loadRoundsCache()),
  );
  const [editingSavedRound, setEditingSavedRound] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [syncSource, setSyncSource] = useState<'supabase' | 'localStorage'>('localStorage');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const inProgressSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRoundRef = useRef<Round | null>(null);
  const activeRoundRef = useRef<Round | null>(activeRound);

  useEffect(() => {
    activeRoundRef.current = activeRound;
  }, [activeRound]);

  const syncRoundToCloud = useCallback((round: Round) => {
    const normalized = normalizeRoundHoles(round);
    pendingRoundRef.current = null;
    void persistRound(normalized)
      .then(setRounds)
      .catch((error) => logSyncError('Failed to sync round to cloud', error));
  }, []);

  const pullFromCloud = useCallback(() => {
    void refreshFromCloud()
      .then((result) => {
        applyCloudResult(
          result,
          activeRoundRef.current,
          setRounds,
          setSavedCourses,
          setProfileState,
          setActiveRoundState,
        );
        setSyncSource(result.source);
        setLastSyncedAt(new Date().toISOString());
        setSyncError(null);
      })
      .catch((error) => {
        const message = formatSyncError(error);
        setSyncError(message);
        logSyncError('Refresh from cloud failed', error);
      });
  }, []);

  const refreshNow = useCallback(async () => {
    try {
      const result = await refreshFromCloud();
      applyCloudResult(
        result,
        activeRoundRef.current,
        setRounds,
        setSavedCourses,
        setProfileState,
        setActiveRoundState,
      );
      setSyncSource(result.source);
      setLastSyncedAt(new Date().toISOString());
      setSyncError(null);
    } catch (error) {
      const message = formatSyncError(error);
      setSyncError(message);
      logSyncError('Manual sync failed', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    bootstrapFromCloudWithRetry()
      .then((result) => {
        if (cancelled) return;
        applyCloudResult(
          result,
          activeRoundRef.current,
          setRounds,
          setSavedCourses,
          setProfileState,
          setActiveRoundState,
        );
        setSyncSource(result.source);
        setLastSyncedAt(new Date().toISOString());
        setSyncError(null);
        setSyncReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = formatSyncError(error);
        setSyncError(message);
        logSyncError('Bootstrap failed — using localStorage cache', error);
        const cachedRounds = loadRoundsCache();
        setRounds(cachedRounds);
        setSavedCourses(
          seedSavedCoursesFromRounds(cachedRounds, loadSavedCoursesCache()),
        );
        setProfileState(loadProfileCache());
        setSyncSource('localStorage');
        setSyncReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!syncReady || !activeRound || activeRound.completed) return;
    if (!hasStartedHoleEntry(activeRound)) return;
    syncRoundToCloud(activeRound);
  }, [syncReady, activeRound?.id, activeRound?.holeEntryStarted, syncRoundToCloud]);

  useEffect(() => {
    if (!syncReady) return;

    pullFromCloud();
    const retryTimer = window.setTimeout(pullFromCloud, MOBILE_BOOTSTRAP_RETRY_MS);

    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      pullFromCloud();
    };

    const intervalId = window.setInterval(refresh, CLOUD_REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('online', refresh);

    return () => {
      window.clearTimeout(retryTimer);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('online', refresh);
    };
  }, [syncReady, pullFromCloud]);

  useEffect(() => {
    const flushPendingRound = () => {
      const pending = pendingRoundRef.current;
      if (!pending) return;
      if (inProgressSyncTimer.current) clearTimeout(inProgressSyncTimer.current);
      syncRoundToCloud(pending);
    };

    window.addEventListener('pagehide', flushPendingRound);
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushPendingRound();
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      window.removeEventListener('pagehide', flushPendingRound);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [syncRoundToCloud]);

  const syncSavedCourseFromRound = (round: Round) => {
    setSavedCourses((prev) => {
      const nextCourses = upsertSavedCourse(prev, round);
      const key = normalizeCourseKey(round.courseName);
      const course = nextCourses.find((item) => normalizeCourseKey(item.courseName) === key);
      if (course) {
        void persistSavedCourse(course)
          .then(setSavedCourses)
          .catch((error) => logSyncError('Failed to sync saved course to cloud', error));
      }
      return nextCourses;
    });
  };

  // Keep in-progress round persisted while editing (survives refresh / mobile tab switch)
  useEffect(() => {
    if (!syncReady || !activeRound || activeRound.completed) return;
    if (!hasStartedHoleEntry(activeRound)) return;

    const normalized = normalizeRoundHoles(activeRound);
    setRounds((prev) => mergeRoundList(prev, normalized));

    pendingRoundRef.current = normalized;
    if (inProgressSyncTimer.current) clearTimeout(inProgressSyncTimer.current);
    inProgressSyncTimer.current = setTimeout(() => {
      syncRoundToCloud(normalized);
    }, IN_PROGRESS_SYNC_MS);

    return () => {
      if (inProgressSyncTimer.current) clearTimeout(inProgressSyncTimer.current);
    };
  }, [activeRound, syncReady, syncRoundToCloud]);

  const setProfile = (p: PlayerProfile) => {
    setProfileState(p);
    saveProfileCache(p);
    void persistProfile(p)
      .then(setProfileState)
      .catch((error) => logSyncError('Failed to sync profile to cloud', error));
  };

  const startNewRound = () => {
    setEditingSavedRound(false);
    const existing = findInProgressRound(rounds);
    if (existing) {
      setActiveRoundState(normalizeRoundHoles(existing));
      return existing;
    }
    const round = createEmptyRound();
    setActiveRoundState(round);
    return round;
  };

  const setActiveRound = (round: Round | null) => {
    setActiveRoundState(round);
  };

  const updateActiveRound = (updates: Partial<Round> | ((prev: Round) => Partial<Round>)) => {
    setActiveRoundState((prev) => {
      if (!prev) return prev;
      if (editingSavedRound) {
        const existing = rounds.find((r) => r.id === prev.id);
        if (existing && isRoundLocked(existing)) return prev;
      }
      const patch = typeof updates === 'function' ? updates(prev) : updates;
      const next = { ...prev, ...patch };
      return patch.holes ? normalizeRoundHoles(next) : next;
    });
  };

  const applySavedCourse = (course: SavedCourse) => {
    setActiveRoundState((prev) => {
      if (!prev) return prev;
      return normalizeRoundHoles(applySavedCourseToRound(prev, course));
    });
  };

  const saveActiveRound = () => {
    if (!activeRound) return;
    const normalized = normalizeRoundHoles({ ...activeRound, holeEntryStarted: true });
    setActiveRoundState(normalized);
    setRounds((prev) => mergeRoundList(prev, normalized));
    syncRoundToCloud(normalized);
    syncSavedCourseFromRound(normalized);
  };

  const saveEditedRound = () => {
    if (!activeRound) return;
    const existing = rounds.find((r) => r.id === activeRound.id);
    if (existing && isRoundLocked(existing)) return;

    const normalized = normalizeRoundHoles({
      ...activeRound,
      completed: existing?.completed ?? true,
      isLocked: existing?.isLocked,
    });

    setRounds((prev) => mergeRoundList(prev, normalized));
    setActiveRoundState(null);
    setEditingSavedRound(false);
    syncRoundToCloud(normalized);
    syncSavedCourseFromRound(normalized);
  };

  const loadRoundForEdit = (id: string): boolean => {
    const round = rounds.find((r) => r.id === id);
    if (!round || isRoundLocked(round)) return false;
    setActiveRoundState(normalizeRoundHoles({ ...round, holeEntryStarted: true }));
    setEditingSavedRound(true);
    return true;
  };

  const resumeRound = (id: string): boolean => {
    const round = rounds.find((r) => r.id === id);
    if (!round || round.completed) return false;
    setActiveRoundState(normalizeRoundHoles({ ...round, holeEntryStarted: true }));
    setEditingSavedRound(false);
    return true;
  };

  const clearEditingRound = () => {
    setEditingSavedRound(false);
  };

  const discardDraftRound = () => {
    setActiveRoundState((prev) => {
      if (!prev || prev.completed || hasStartedHoleEntry(prev)) return prev;
      return null;
    });
  };

  const completeRound = () => {
    if (!activeRound) return;
    const completed = normalizeRoundHoles({ ...activeRound, completed: true, isLocked: true });
    setRounds((prev) => mergeRoundList(prev, completed));
    setActiveRoundState(null);
    setEditingSavedRound(false);
    syncRoundToCloud(completed);
  };

  const deleteRound = (id: string) => {
    const round = rounds.find((r) => r.id === id);
    if (round && isRoundLocked(round)) return;
    if (activeRound?.id === id) {
      setActiveRoundState(null);
      setEditingSavedRound(false);
    }
    void removeRound(id)
      .then(setRounds)
      .catch((error) => logSyncError('Failed to delete round from cloud', error));
  };

  const deleteSavedCourse = (id: string) => {
    void removeSavedCourse(id)
      .then(setSavedCourses)
      .catch((error) => logSyncError('Failed to delete saved course from cloud', error));
  };

  const setRoundLocked = (id: string, locked: boolean) => {
    const round = rounds.find((r) => r.id === id);
    if (!round) return;

    const updated = { ...round, isLocked: locked };
    setRounds((prev) => prev.map((r) => (r.id === id ? updated : r)));
    if (activeRound?.id === id) {
      setActiveRoundState((prev) => (prev ? { ...prev, isLocked: locked } : prev));
    }
    syncRoundToCloud(updated);
  };

  return (
    <GolfContext.Provider
      value={{
        rounds,
        savedCourses,
        profile,
        activeRound,
        editingSavedRound,
        syncReady,
        syncSource,
        lastSyncedAt,
        syncError,
        refreshNow,
        setProfile,
        startNewRound,
        setActiveRound,
        updateActiveRound,
        applySavedCourse,
        saveActiveRound,
        saveEditedRound,
        loadRoundForEdit,
        resumeRound,
        clearEditingRound,
        discardDraftRound,
        completeRound,
        deleteRound,
        deleteSavedCourse,
        setRoundLocked,
      }}
    >
      {children}
    </GolfContext.Provider>
  );
}

export function useGolf() {
  const ctx = useContext(GolfContext);
  if (!ctx) throw new Error('useGolf must be used within GolfProvider');
  return ctx;
}
