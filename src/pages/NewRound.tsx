import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import RoundSetupForm from '../components/RoundSetupForm';
import { useGolf } from '../context/GolfContext';
import { hasStartedHoleEntry } from '../types';

export default function NewRound() {
  const navigate = useNavigate();
  const { activeRound, startNewRound, saveActiveRound, clearEditingRound, discardDraftRound } =
    useGolf();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    clearEditingRound();
    if (activeRound && !activeRound.completed) {
      if (hasStartedHoleEntry(activeRound)) {
        navigate('/hole-entry', { replace: true });
      }
      return;
    }
    startNewRound();
  }, [activeRound, startNewRound, clearEditingRound, navigate]);

  useEffect(() => {
    return () => {
      discardDraftRound();
    };
  }, [discardDraftRound]);

  if (!activeRound) return null;

  const handleStart = () => {
    if (!activeRound.courseName.trim()) return;
    saveActiveRound();
    navigate('/hole-entry');
  };

  return (
    <>
      <PageHeader title="Round Setup" subtitle="Configure your round" backTo="/" />
      <RoundSetupForm
        primaryLabel="Start Hole Entry"
        onPrimary={handleStart}
        primaryDisabled={!activeRound.courseName.trim()}
      />
    </>
  );
}
