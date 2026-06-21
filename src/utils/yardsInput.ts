export type YardsValue = number | '';

export function yardsAsNumber(yards: YardsValue): number {
  return typeof yards === 'number' ? yards : 0;
}

export function normalizeYardsForBlur(value: YardsValue): YardsValue {
  if (value === '') return '';
  if (Number.isNaN(value)) return '';
  return Math.min(700, Math.max(0, Math.round(value)));
}
