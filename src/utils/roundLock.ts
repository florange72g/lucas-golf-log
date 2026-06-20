import type { Round } from '../types';

export const UNLOCK_CONFIRM =
  'Unlock this round? You will be able to edit or delete it.';

export const LOCKED_EDIT_MESSAGE =
  'This round is locked. Please unlock it before editing.';

export const LOCKED_DELETE_MESSAGE =
  'This round is locked. Please unlock it before deleting.';

/** Completed rounds are locked unless explicitly unlocked (isLocked === false). */
export function isRoundLocked(round: Pick<Round, 'completed' | 'isLocked'>): boolean {
  if (!round.completed) return false;
  return round.isLocked !== false;
}
