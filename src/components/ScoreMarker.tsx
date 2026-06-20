import { getScoreMarkerType } from '../utils/scoreMarker';

export default function ScoreMarker({ score, par }: { score: number; par: number }) {
  const marker = getScoreMarkerType(score, par);

  if (marker === 'par') {
    return <span className="score-marker">{score}</span>;
  }

  if (marker === 'eagle') {
    return (
      <span className="score-marker double-circle">
        <span>{score}</span>
      </span>
    );
  }

  if (marker === 'birdie') {
    return <span className="score-marker circle">{score}</span>;
  }

  if (marker === 'bogey') {
    return <span className="score-marker square">{score}</span>;
  }

  return (
    <span className="score-marker double-square">
      <span>{score}</span>
    </span>
  );
}
