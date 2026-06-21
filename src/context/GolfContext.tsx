import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PlayerProfile, Round, SavedCourse } from '../types';
import { createEmptyRound } from '../types';
import {
  bootstrapFromCloud,
  persistRound,
  persistSavedCourse,
  refreshFromCloud,
  removeRound,
  removeSavedCourse,
} from '../utils/cloudSync';
import {
  applySavedCourseToRound,
  loadSavedCoursesCache,
  normalizeCourseKey,
  seedSavedCoursesFromRounds,
  upsertSavedCourse,
} from '../utils/savedCourses';
import { isRoundLocked } from '../utils/roundLock';
import { syncError } from '../utils/syncLog';
import {
  loadProfile,
  loadRoundsCache,
  normalizeRoundHoles,
  saveProfile,
} from '../utils/storage';

const IN_PROGRESS_SYNC_MS = 1500;

function findInProgressRound(rounds: Round[]): Round | null {
  return rounds.find((r) => !r.completed) ?? null;
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

interface GolfContextValue {
  rounds: Round[];
  savedCourses: SavedCourse[];
  profile: PlayerProfile;
  activeRound: Round | null;
  editingSavedRound: boolean;
  syncReady: boolean;
  setProfile: (profile: PlayerProfile) => void;
  startNewRound: () => Round;
  setActiveRound: (round: Round | null) => void;
  updateActiveRound: (updates: Partial<Round>) => void;
  applySavedCourse: (course: SavedCourse) => void;
  saveActiveRound: () => void;
  saveEditedRound: () => void;
  loadRoundForEdit: (id: string) => boolean;
  resumeRound: (id: string) => boolean;
  clearEditingRound: () => void;
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
  const [profile, setProfileState] = useState<PlayerProfile>(() => loadProfile());
  const [activeRound, setActiveRoundState] = useState<Round | null>(() =>
    findInProgressRound(loadRoundsCache()),
  );
  const [editingSavedRound, setEditingSavedRound] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const inProgressSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    bootstrapFromCloud()
      .then((result) => {
        if (cancelled) return;
        setRounds(result.rounds);
        setSavedCourses(result.savedCourses);
        setActiveRoundState((prev) => prev ?? findInProgressRound(result.rounds));
        setSyncReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        syncError('Bootstrap failed — using localStorage cache', error);
        const cachedRounds = loadRoundsCache();
        setRounds(cachedRounds);
        setSavedCourses(
          seedSavedCoursesFromRounds(cachedRounds, loadSavedCoursesCache()),
        );
        setSyncReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!syncReady) return;

    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshFromCloud()
        .then((result) => {
          setRounds(result.rounds);
          setSavedCourses(result.savedCourses);
        })
        .catch((error) => syncError('Refresh from cloud failed', error));
    };

    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [syncReady]);

  const syncRoundToCloud = (round: Round) => {
    const normalized = normalizeRoundHoles(round);
    void persistRound(normalized)
      .then(setRounds)
      .catch((error) => syncError('Failed to sync round to cloud', error));
  };

  const syncSavedCourseFromRound = (round: Round) => {
    setSavedCourses((prev) => {
      const nextCourses = upsertSavedCourse(prev, round);
      const key = normalizeCourseKey(round.courseName);
      const course = nextCourses.find((item) => normalizeCourseKey(item.courseName) === key);
      if (course) {
        void persistSavedCourse(course)
          .then(setSavedCourses)
          .catch((error) => syncError('Failed to sync saved course to cloud', error));
      }
      return nextCourses;
    });
  };

  // Keep in-progress round persisted while editing (survives refresh / mobile tab switch)
  useEffect(() => {
    if (!syncReady || !activeRound || activeRound.completed) return;

    const normalized = normalizeRoundHoles(activeRound);
    setRounds((prev) => mergeRoundList(prev, normalized));

    if (inProgressSyncTimer.current) clearTimeout(inProgressSyncTimer.current);
    inProgressSyncTimer.current = setTimeout(() => {
      syncRoundToCloud(normalized);
    }, IN_PROGRESS_SYNC_MS);

    return () => {
      if (inProgressSyncTimer.current) clearTimeout(inProgressSyncTimer.current);
    };
  }, [activeRound, syncReady]);

  const setProfile = (p: PlayerProfile) => {
    setProfileState(p);
    saveProfile(p);
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

  const updateActiveRound = (updates: Partial<Round>) => {
    setActiveRoundState((prev) => {
      if (!prev) return prev;
      if (editingSavedRound) {
        const existing = rounds.find((r) => r.id === prev.id);
        if (existing && isRoundLocked(existing)) return prev;
      }
      const next = { ...prev, ...updates };
      return updates.holes ? normalizeRoundHoles(next) : next;
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
    const normalized = normalizeRoundHoles(activeRound);
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
    setActiveRoundState(normalizeRoundHoles({ ...round }));
    setEditingSavedRound(true);
    return true;
  };

  const resumeRound = (id: string): boolean => {
    const round = rounds.find((r) => r.id === id);
    if (!round || round.completed) return false;
    setActiveRoundState(normalizeRoundHoles({ ...round }));
    setEditingSavedRound(false);
    return true;
  };

  const clearEditingRound = () => {
    setEditingSavedRound(false);
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
      .catch((error) => syncError('Failed to delete round from cloud', error));
  };

  const deleteSavedCourse = (id: string) => {
    void removeSavedCourse(id)
      .then(setSavedCourses)
      .catch((error) => syncError('Failed to delete saved course from cloud', error));
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
