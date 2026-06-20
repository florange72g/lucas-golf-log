import { Link } from 'react-router-dom';
import type { CoachReflection } from '../types';
import { parseBulletList } from '../utils/text';
import { formatScoreToPar } from '../utils/stats';

interface TodaysRoundSummaryProps {
  score: number;
  toPar: number;
  coach: CoachReflection;
  showCoachLink?: boolean;
}

export default function TodaysRoundSummary({
  score,
  toPar,
  coach,
  showCoachLink = false,
}: TodaysRoundSummaryProps) {
  const strengths = parseBulletList(coach.strengths);
  const focusAreas = parseBulletList(coach.improvements);
  const nextPractice = parseBulletList(coach.practiceFocus);
  const hasContent = strengths.length > 0 || focusAreas.length > 0 || nextPractice.length > 0;

  return (
    <section className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-fairway-600">
        Today&apos;s Round Summary
      </h2>

      <p className="mt-3 text-base text-fairway-800">
        <span className="font-semibold">Score:</span>{' '}
        <span className="font-bold text-fairway-900">
          {score} ({formatScoreToPar(toPar)})
        </span>
      </p>

      {hasContent ? (
        <div className="mt-4 space-y-4">
          <SummaryList title="Strengths" items={strengths} />
          <SummaryList title="Focus Areas" items={focusAreas} />
          <SummaryList title="Next Practice" items={nextPractice} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-fairway-400">
          Add coach notes to capture strengths, focus areas, and practice plans.
        </p>
      )}

      {showCoachLink && !hasContent && (
        <Link to="/coach" className="btn-secondary mt-4 block w-full text-center">
          Add Coach Notes
        </Link>
      )}
    </section>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-semibold text-fairway-800">{title}:</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm text-fairway-600">
            <span className="shrink-0 text-fairway-400">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
