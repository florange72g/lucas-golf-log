import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useGolf } from '../context/GolfContext';
import type { CoachReflection } from '../types';
import { DEFAULT_COACH } from '../types';
import { generateRoundPdf } from '../utils/generateGolfReportPdf';

const FIELDS: { key: keyof CoachReflection; label: string; placeholder: string }[] = [
  {
    key: 'strengths',
    label: 'Strengths Today',
    placeholder: 'What did you do well? Good course management, solid drives...',
  },
  {
    key: 'improvements',
    label: 'Areas to Improve',
    placeholder: 'Short game, lag putting, club selection on par 5s...',
  },
  {
    key: 'practiceFocus',
    label: 'Practice Focus',
    placeholder: 'Drills and priorities for next practice session...',
  },
  {
    key: 'goals',
    label: 'Goals Going Forward',
    placeholder: 'Tournament prep, scoring targets, mental game goals...',
  },
];

export default function CoachReflection() {
  const navigate = useNavigate();
  const { activeRound, profile, updateActiveRound, saveActiveRound } = useGolf();
  const [exporting, setExporting] = useState(false);

  const coach = activeRound?.coach ?? DEFAULT_COACH;

  const update = (key: keyof CoachReflection, value: string) => {
    if (!activeRound) return;
    updateActiveRound({
      coach: { ...activeRound.coach, [key]: value },
    });
  };

  const handleSave = () => {
    saveActiveRound();
    navigate(activeRound ? '/round-summary/active' : '/');
  };

  const handleExportPdf = async () => {
    if (!activeRound) return;
    setExporting(true);
    try {
      saveActiveRound();
      await generateRoundPdf(profile, activeRound);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Coach Report"
        subtitle="Post-round analysis & PDF export"
        backTo={activeRound ? '/round-summary/active' : '/'}
        action={
          activeRound ? (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-fairway-900 disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
          ) : undefined
        }
      />

      <div className="space-y-5 px-4 pt-2 pb-8">
        {!activeRound && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Start a round to attach coach notes and export a PDF report.
          </p>
        )}

        {activeRound && (
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-fairway-700 bg-fairway-800 py-4 text-center font-semibold text-white shadow-md disabled:opacity-60"
          >
            <svg className="h-5 w-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M6 18h12a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {exporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
        )}

        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="mb-1.5 block text-sm font-medium text-fairway-700">{label}</label>
            <textarea
              value={coach[key]}
              onChange={(e) => update(key, e.target.value)}
              rows={3}
              placeholder={placeholder}
              className="input-field resize-none"
            />
          </div>
        ))}

        <button type="button" onClick={handleSave} className="btn-primary w-full">
          Save Reflection
        </button>
      </div>
    </>
  );
}
