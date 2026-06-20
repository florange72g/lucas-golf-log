export default function ScoreMarker({ score, par }: { score: number; par: number }) {
  const diff = score - par;

  if (diff === 0) {
    return <span className="score-marker">{score}</span>;
  }

  if (diff <= -2) {
    return (
      <span className="score-marker double-circle">
        <span>{score}</span>
      </span>
    );
  }

  if (diff === -1) {
    return <span className="score-marker circle">{score}</span>;
  }

  if (diff === 1) {
    return <span className="score-marker square">{score}</span>;
  }

  return (
    <span className="score-marker double-square">
      <span>{score}</span>
    </span>
  );
}
