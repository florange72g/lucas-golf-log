export const APP_UNLOCK_PASSWORD = '0430';

/** @deprecated Use APP_UNLOCK_PASSWORD */
export const PROFILE_UNLOCK_PASSWORD = APP_UNLOCK_PASSWORD;

export const PROFILE_LOCKED_EDIT_MESSAGE =
  'Profile is locked. Enter the password to edit.';

export const STATS_LOCKED_MESSAGE = 'Stats is locked. Enter the password to view.';

export const WRONG_PASSWORD_MESSAGE = 'Incorrect password.';

/** @deprecated Use WRONG_PASSWORD_MESSAGE */
export const PROFILE_WRONG_PASSWORD_MESSAGE = WRONG_PASSWORD_MESSAGE;

const STATS_UNLOCK_KEY = 'golf-log-stats-unlocked';

export function verifyUnlockPassword(input: string): boolean {
  return input.trim() === APP_UNLOCK_PASSWORD;
}

/** @deprecated Use verifyUnlockPassword */
export function verifyProfileUnlockPassword(input: string): boolean {
  return verifyUnlockPassword(input);
}

export function promptUnlock(message: string): boolean {
  const password = window.prompt(message);
  if (password === null) return false;
  if (verifyUnlockPassword(password)) return true;
  window.alert(WRONG_PASSWORD_MESSAGE);
  return false;
}

export function promptProfileUnlock(): boolean {
  return promptUnlock(PROFILE_LOCKED_EDIT_MESSAGE);
}

export function isStatsUnlocked(): boolean {
  return sessionStorage.getItem(STATS_UNLOCK_KEY) === '1';
}

export function promptStatsUnlock(): boolean {
  if (isStatsUnlocked()) return true;
  if (!promptUnlock(STATS_LOCKED_MESSAGE)) return false;
  sessionStorage.setItem(STATS_UNLOCK_KEY, '1');
  return true;
}
