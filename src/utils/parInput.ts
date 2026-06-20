export const VALID_PARS = [3, 4, 5] as const;

export type ValidPar = (typeof VALID_PARS)[number];

export type ParValue = number | '';

export function parseParChange(value: string): ParValue {
  if (value === '') return '';
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return '';
  return parsed;
}

export function parAsNumber(par: ParValue): number {
  return typeof par === 'number' ? par : 0;
}

export function isValidPar(value: number): value is ValidPar {
  return value === 3 || value === 4 || value === 5;
}

export function parseParInputValue(value: string): number | '' {
  if (value.trim() === '') return '';
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return '';
  return parsed;
}

export function normalizeParForSave(value: string | number): ValidPar | null {
  if (value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(parsed) || !isValidPar(parsed)) return null;
  return parsed;
}

export const PAR_ERROR_MESSAGE = 'Par must be 3, 4, or 5';
