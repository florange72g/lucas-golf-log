import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StarRating from '../components/StarRating';
import { useGolf } from '../context/GolfContext';
import type { MentalPerformance } from '../types';
import { DEFAULT_MENTAL, normalizeMental } from '../types';

const METRICS: { key: keyof Pick<MentalPerformance, 'focus' | 'confidence' | 'emotionalControl' | 'courseManagement'>; label: string }[] = [
  { key: 'focus', label: 'Focus' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'emotionalControl', label: 'Emotional Control' },
  { key: 'courseManagement', label: 'Course Management' },
];

const REFLECTIONS: { key: keyof Pick<MentalPerformance, 'highlightOfRound' | 'keyLearning' | 'practiceFocus'>; label: string; placeholder: string }[] = [
  { key: 'highlightOfRound', label: 'Highlight of the Round', placeholder: 'e.g. Approach shot on Hole 14 to 3 feet' },
  { key: 'keyLearning', label: 'Key Learning', placeholder: 'e.g. Need to improve speed control on mid-range putts' },
  { key: 'practiceFocus', label: 'Practice Focus', placeholder: 'e.g. Putting inside 6 feet' },
];

type RatingKey = (typeof METRICS)[number]['key'];
type ReflectionKey = (typeof REFLECTIONS)[number]['key'];

export default function MentalPerformance() {
  const navigate = useNavigate();
  const { activeRound, updateActiveRound, saveActiveRound } = useGolf();

  const mental = normalizeMental(activeRound?.mental ?? DEFAULT_MENTAL);

  const updateRating = (key: RatingKey, value: number) => {
    if (!activeRound) return;
    updateActiveRound({
      mental: normalizeMental({ ...activeRound.mental, [key]: value }),
    });
  };

  const updateReflection = (key: ReflectionKey, value: string) => {
    if (!activeRound) return;
    updateActiveRound({
      mental: normalizeMental({ ...activeRound.mental, [key]: value }),
    });
  };

  const avg =
    Math.round(
      ((mental.focus + mental.confidence + mental.emotionalControl + mental.courseManagement) / 4) * 10,
    ) / 10;

  const handleSave = () => {
    saveActiveRound();
    navigate(activeRound ? '/round-summary/active' : '/');
  };

  return (
    <>
      <PageHeader
        title="Mental Performance"
        subtitle="Quick post-round check-in"
        backTo={activeRound ? '/round-summary/active' : '/'}
      />

      <div className="space-y-4 px-4 pt-2 pb-6">
        <div className="flex items-center justify-between rounded-2xl bg-fairway-800 px-5 py-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fairway-300">Overall</p>
            <p className="text-3xl font-bold text-gold-400">{avg}<span className="text-lg text-fairway-300">/5</span></p>
          </div>
          <p className="max-w-[9rem] text-right text-xs text-fairway-300">Tap stars · optional reflections below</p>
        </div>

        {!activeRound && (
          <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            Start a round to save mental scores with your round.
          </p>
        )}

        <div className="space-y-2">
          {METRICS.map(({ key, label }) => (
            <StarRating
              key={key}
              label={label}
              value={mental[key]}
              onChange={(v) => updateRating(key, v)}
            />
          ))}
        </div>

        <div className="space-y-2 pt-1">
          {REFLECTIONS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold text-fairway-600">{label}</label>
              <input
                type="text"
                value={mental[key]}
                onChange={(e) => updateReflection(key, e.target.value)}
                placeholder={placeholder}
                className="input-field py-2.5 text-base"
              />
            </div>
          ))}
        </div>

        <button type="button" onClick={handleSave} className="btn-primary w-full">
          Save & Done
        </button>
      </div>
    </>
  );
}
