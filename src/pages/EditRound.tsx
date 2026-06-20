import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import RoundSetupForm from '../components/RoundSetupForm';
import { useGolf } from '../context/GolfContext';
import { isRoundLocked, LOCKED_EDIT_MESSAGE } from '../utils/roundLock';

export default function EditRound() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRound, rounds, loadRoundForEdit, saveActiveRound, saveEditedRound } = useGolf();
  const loaded = useRef(false);

  useEffect(() => {
    if (!id || loaded.current) return;
    loaded.current = true;
    const round = rounds.find((r) => r.id === id);
    if (round && isRoundLocked(round)) {
      window.alert(LOCKED_EDIT_MESSAGE);
      navigate('/rounds', { replace: true });
      return;
    }
    if (!loadRoundForEdit(id)) {
      navigate('/rounds', { replace: true });
    }
  }, [id, loadRoundForEdit, navigate, rounds]);

  if (!activeRound || activeRound.id !== id) return null;

  const handleEditHoles = () => {
    if (!activeRound.courseName.trim()) return;
    saveActiveRound();
    navigate('/hole-entry');
  };

  const handleSave = () => {
    if (!activeRound.courseName.trim()) return;
    saveEditedRound();
    navigate('/rounds');
  };

  return (
    <>
      <PageHeader title="Edit Round" subtitle={activeRound.courseName} backTo="/rounds" />
      <RoundSetupForm
        primaryLabel="Edit Hole Data"
        onPrimary={handleEditHoles}
        primaryDisabled={!activeRound.courseName.trim()}
        secondaryLabel="Save Round"
        onSecondary={handleSave}
      />
    </>
  );
}
