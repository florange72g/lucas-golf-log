export type ScoreMarkerType = 'eagle' | 'birdie' | 'par' | 'bogey' | 'doubleBogey';

export function getScoreMarkerType(score: number, par: number): ScoreMarkerType {
  const diff = score - par;
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  return 'doubleBogey';
}
