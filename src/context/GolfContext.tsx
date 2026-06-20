import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PlayerProfile, Round, SavedCourse } from '../types';
import { createEmptyRound } from '../types';
import { applySavedCourseToRound, loadSavedCourses, saveSavedCourses, seedSavedCoursesFromRounds, upsertSavedCourse } from '../utils/savedCourses';
import { loadProfile, loadRounds, normalizeRoundHoles, saveProfile, saveRounds } from '../utils/storage';

function findInProgressRound(rounds: Round[]): Round | null {
  return rounds.find((r) => !r.completed) ?? null;
}

interface GolfContextValue {
  rounds: Round[];
  savedCourses: SavedCourse[];
  profile: PlayerProfile;
  activeRound: Round | null;
  editingSavedRound: boolean;
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
}

const GolfContext = createContext<GolfContextValue | null>(null);

export function GolfProvider({ children }: { children: ReactNode }) {
  const [rounds, setRounds] = useState<Round[]>(() => loadRounds());
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>(() =>
    seedSavedCoursesFromRounds(loadRounds(), loadSavedCourses()),
  );
  const [profile, setProfileState] = useState<PlayerProfile>(() => loadProfile());
  const [activeRound, setActiveRoundState] = useState<Round | null>(() =>
    findInProgressRound(loadRounds()),
  );
  const [editingSavedRound, setEditingSavedRound] = useState(false);

  useEffect(() => {
    saveRounds(rounds);
  }, [rounds]);

  useEffect(() => {
    saveSavedCourses(savedCourses);
  }, [savedCourses]);

  const persistCourseProfile = (round: Round) => {
    setSavedCourses((prev) => upsertSavedCourse(prev, round));
  };

  // Keep in-progress round persisted while editing (survives refresh / mobile tab switch)
  useEffect(() => {
    if (!activeRound || activeRound.completed) return;
    const normalized = normalizeRoundHoles(activeRound);
    setRounds((prev) => {
      const idx = prev.findIndex((r) => r.id === normalized.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      return [normalized, ...prev];
    });
  }, [activeRound]);

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
    setRounds((prev) => {
      const idx = prev.findIndex((r) => r.id === normalized.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      return [normalized, ...prev];
    });
    persistCourseProfile(normalized);
  };

  const saveEditedRound = () => {
    if (!activeRound) return;
    const existing = rounds.find((r) => r.id === activeRound.id);
    const normalized = normalizeRoundHoles({
      ...activeRound,
      completed: existing?.completed ?? true,
    });
    setRounds((prev) => {
      const idx = prev.findIndex((r) => r.id === normalized.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      return [normalized, ...prev];
    });
    setActiveRoundState(null);
    setEditingSavedRound(false);
    persistCourseProfile(normalized);
  };

  const loadRoundForEdit = (id: string): boolean => {
    const round = rounds.find((r) => r.id === id);
    if (!round) return false;
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
    const completed = normalizeRoundHoles({ ...activeRound, completed: true });
    setRounds((prev) => {
      const idx = prev.findIndex((r) => r.id === completed.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = completed;
        return next;
      }
      return [completed, ...prev];
    });
    setActiveRoundState(null);
    setEditingSavedRound(false);
  };

  const deleteRound = (id: string) => {
    setRounds((prev) => prev.filter((r) => r.id !== id));
    if (activeRound?.id === id) {
      setActiveRoundState(null);
      setEditingSavedRound(false);
    }
  };

  return (
    <GolfContext.Provider
      value={{
        rounds,
        savedCourses,
        profile,
        activeRound,
        editingSavedRound,
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
