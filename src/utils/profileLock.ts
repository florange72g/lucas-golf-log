export const PROFILE_UNLOCK_PASSWORD = '0430';

export const PROFILE_LOCKED_EDIT_MESSAGE =
  'Profile is locked. Enter the password to edit.';

export const PROFILE_WRONG_PASSWORD_MESSAGE = 'Incorrect password.';

export function verifyProfileUnlockPassword(input: string): boolean {
  return input.trim() === PROFILE_UNLOCK_PASSWORD;
}

export function promptProfileUnlock(): boolean {
  const password = window.prompt(PROFILE_LOCKED_EDIT_MESSAGE);
  if (password === null) return false;
  if (verifyProfileUnlockPassword(password)) return true;
  window.alert(PROFILE_WRONG_PASSWORD_MESSAGE);
  return false;
}
