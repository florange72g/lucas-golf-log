import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import RoundLockControl from '../components/RoundLockControl';
import { useGolf } from '../context/GolfContext';
import { ROUND_TYPES, type Round } from '../types';
import {
  isRoundLocked,
  LOCKED_DELETE_MESSAGE,
  LOCKED_EDIT_MESSAGE,
} from '../utils/roundLock';
import { calcTotalPar, calcTotalScore } from '../utils/stats';

const DELETE_CONFIRM =
  'Are you sure you want to delete this round? This cannot be undone.';

export default function RoundsHistory() {
  const navigate = useNavigate();
  const { rounds, deleteRound, loadRoundForEdit, resumeRound, setRoundLocked } = useGolf();

  const sortedRounds = [...rounds].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const handleView = (id: string, completed: boolean) => {
    if (completed) {
      navigate(`/round-summary/${id}`);
      return;
    }
    if (resumeRound(id)) {
      navigate('/hole-entry');
    }
  };

  const handleEdit = (round: Round) => {
    if (isRoundLocked(round)) {
      window.alert(LOCKED_EDIT_MESSAGE);
      return;
    }
    if (loadRoundForEdit(round.id)) {
      navigate(`/edit-round/${round.id}`);
    }
  };

  const handleDelete = (round: Round) => {
    if (isRoundLocked(round)) {
      window.alert(LOCKED_DELETE_MESSAGE);
      return;
    }
    if (window.confirm(DELETE_CONFIRM)) {
      deleteRound(round.id);
    }
  };

  return (
    <>
      <PageHeader title="Round History" subtitle="View, edit, or delete saved rounds" backTo="/" />

      <div className="space-y-3 px-4 pb-6 pt-1">
        {sortedRounds.length === 0 ? (
          <div className="rounded-2xl border border-sand bg-white p-8 text-center shadow-sm">
            <p className="text-fairway-600">No saved rounds yet.</p>
            <button
              type="button"
              onClick={() => navigate('/new-round')}
              className="btn-primary mt-4"
            >
              Start a Round
            </button>
          </div>
        ) : (
          sortedRounds.map((round) => {
            const totalScore = calcTotalScore(round.holes);
            const totalPar = calcTotalPar(round.holes);
            const roundTypeLabel =
              ROUND_TYPES.find((t) => t.value === round.roundType)?.label ?? round.roundType;
            const locked = isRoundLocked(round);

            return (
              <article
                key={round.id}
                className="rounded-2xl border border-sand bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fairway-800">
                      {round.courseName || 'Untitled Course'}
                    </p>
                    <p className="mt-0.5 text-xs text-fairway-400">
                      {new Date(round.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-1 text-xs font-medium text-fairway-500">{roundTypeLabel}</p>
                    {round.completed ? (
                      <RoundLockControl
                        round={round}
                        onSetLocked={(locked) => setRoundLocked(round.id, locked)}
                        className="mt-2"
                      />
                    ) : (
                      <span className="mt-2 inline-block rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fairway-800">
                        In Progress
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-bold text-fairway-800">{totalScore}</p>
                    <p className="text-xs text-fairway-400">Par {totalPar}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleView(round.id, round.completed)}
                    className="rounded-xl border border-fairway-300 bg-fairway-50 py-2.5 text-xs font-semibold text-fairway-700 transition active:bg-fairway-100"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(round)}
                    aria-disabled={locked}
                    className={`rounded-xl border border-fairway-300 bg-white py-2.5 text-xs font-semibold text-fairway-700 transition active:bg-fairway-50${
                      locked ? ' cursor-not-allowed opacity-40' : ''
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(round)}
                    aria-disabled={locked}
                    className={`rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-700 transition active:bg-red-100${
                      locked ? ' cursor-not-allowed opacity-40' : ''
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
