import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PlayerProfile, Round } from '../types';
import { createEmptyRound } from '../types';
import { loadProfile, loadRounds, normalizeRoundHoles, saveProfile, saveRounds } from '../utils/storage';

function findInProgressRound(rounds: Round[]): Round | null {
  return rounds.find((r) => !r.completed) ?? null;
}

interface GolfContextValue {
  rounds: Round[];
  profile: PlayerProfile;
  activeRound: Round | null;
  setProfile: (profile: PlayerProfile) => void;
  startNewRound: () => Round;
  setActiveRound: (round: Round | null) => void;
  updateActiveRound: (updates: Partial<Round>) => void;
  saveActiveRound: () => void;
  completeRound: () => void;
  deleteRound: (id: string) => void;
}

const GolfContext = createContext<GolfContextValue | null>(null);

export function GolfProvider({ children }: { children: ReactNode }) {
  const [rounds, setRounds] = useState<Round[]>(() => loadRounds());
  const [profile, setProfileState] = useState<PlayerProfile>(() => loadProfile());
  const [activeRound, setActiveRoundState] = useState<Round | null>(() =>
    findInProgressRound(loadRounds()),
  );

  useEffect(() => {
    saveRounds(rounds);
  }, [rounds]);

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
  };

  const deleteRound = (id: string) => {
    setRounds((prev) => prev.filter((r) => r.id !== id));
    if (activeRound?.id === id) setActiveRoundState(null);
  };

  return (
    <GolfContext.Provider
      value={{
        rounds,
        profile,
        activeRound,
        setProfile,
        startNewRound,
        setActiveRound,
        updateActiveRound,
        saveActiveRound,
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
