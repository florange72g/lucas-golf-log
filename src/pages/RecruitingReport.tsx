import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SwipeableTournamentResultRow from '../components/SwipeableTournamentResultRow';
import { useGolf } from '../context/GolfContext';
import {
  formatScoringAverage,
  lastTournamentScores,
  roundStats,
  tournamentCompletedRounds,
} from '../utils/stats';
import { promptProfileUnlock } from '../utils/profileLock';
import { formatHandicap, type PlayerProfile } from '../types';

export default function RecruitingReport() {
  const { rounds, profile, setProfile } = useGolf();
  const [editing, setEditing] = useState(false);
  const [profileUnlocked, setProfileUnlocked] = useState(false);
  const [draft, setDraft] = useState<PlayerProfile>(profile);

  const tournamentRounds = tournamentCompletedRounds(rounds);
  const stats = tournamentRounds.length > 0 ? roundStats(tournamentRounds) : null;
  const recentScores = lastTournamentScores(rounds, 10);
  const profileLocked = !profileUnlocked;

  const saveProfile = () => {
    setProfile(draft);
    setEditing(false);
  };

  const handlePrint = () => window.print();

  const lockProfile = () => {
    setProfileUnlocked(false);
    setEditing(false);
    setDraft(profile);
  };

  const tryUnlockProfile = (): boolean => {
    if (profileUnlocked) return true;
    if (promptProfileUnlock()) {
      setProfileUnlocked(true);
      return true;
    }
    return false;
  };

  const handleEditClick = () => {
    if (!tryUnlockProfile()) return;
    setDraft(profile);
    setEditing(true);
  };

  const handleLockClick = () => {
    if (profileLocked) {
      tryUnlockProfile();
      return;
    }
    lockProfile();
  };

  const handleDeleteTournamentResult = (id: string) => {
    const next = {
      ...profile,
      tournamentResults: profile.tournamentResults.filter((result) => result.id !== id),
    };
    setProfile(next);
    setDraft(next);
  };

  const displayProfile = editing ? draft : profile;

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Tournament performance summary"
        backTo="/"
        action={
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-fairway-700 px-3 py-1.5 text-xs font-semibold text-gold-400 print:hidden"
          >
            Print
          </button>
        }
      />

      <div className="recruiting-report space-y-5 px-4 pt-2 pb-8">
        <section className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            {!editing ? (
              <div>
                <h2 className="text-2xl font-bold text-fairway-800">{displayProfile.name}</h2>
                <p className="mt-1 text-sm font-medium text-fairway-500">
                  Class of {displayProfile.gradYear}
                </p>
              </div>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">Edit Profile</p>
            )}
            {!editing && (
              <div className="flex shrink-0 items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleLockClick}
                  aria-label={profileLocked ? 'Unlock profile to edit' : 'Lock profile'}
                  title={profileLocked ? 'Unlock to edit' : 'Lock profile'}
                  className="rounded-lg border border-sand p-1.5 text-fairway-600 active:bg-fairway-50"
                >
                  {profileLocked ? <LockIcon /> : <UnlockIcon />}
                </button>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="text-xs font-semibold text-fairway-500 underline"
                >
                  Edit
                </button>
              </div>
            )}
            {editing && (
              <button
                type="button"
                onClick={lockProfile}
                className="shrink-0 text-xs font-semibold text-fairway-500 underline print:hidden"
              >
                Cancel
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-4 space-y-2 print:hidden">
              <ProfileField label="Player" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
              <ProfileField
                label="Class"
                type="number"
                value={String(draft.gradYear)}
                onChange={(v) => setDraft({ ...draft, gradYear: Number(v) })}
              />
              <ProfileField
                label="Handicap"
                value={String(draft.handicap)}
                onChange={(v) => setDraft({ ...draft, handicap: Number(v) })}
                hint="Use negative for plus (e.g. -1 = +1.0)"
              />
              <ProfileField label="School" value={draft.school} onChange={(school) => setDraft({ ...draft, school })} />
              <div className="grid grid-cols-2 gap-2">
                <ProfileField label="GPA" value={draft.gpa} onChange={(gpa) => setDraft({ ...draft, gpa })} />
                <ProfileField label="SAT" value={draft.sat} onChange={(sat) => setDraft({ ...draft, sat })} />
              </div>
              <ProfileField label="Email" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
              <ProfileField label="Coach" value={draft.coach} onChange={(coach) => setDraft({ ...draft, coach })} />
              <ProfileField
                label="Strength"
                value={draft.strength}
                onChange={(strength) => setDraft({ ...draft, strength })}
              />
              <ProfileField
                label="Development Area"
                value={draft.developmentArea}
                onChange={(developmentArea) => setDraft({ ...draft, developmentArea })}
              />
              <button type="button" onClick={saveProfile} className="btn-primary w-full text-sm">
                Save Profile
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-0 border-t border-sand pt-4">
              <ReportRow label="Handicap" value={formatHandicap(displayProfile.handicap)} />
              <ReportRow label="School" value={displayProfile.school || '—'} />
              <ReportPairRow
                left={{ label: 'GPA', value: displayProfile.gpa || '—' }}
                right={{ label: 'SAT', value: displayProfile.sat || '—' }}
              />
              <ReportRow label="Email" value={displayProfile.email || '—'} />
              <ReportRow label="Coach" value={displayProfile.coach || '—'} />
            </div>
          )}
        </section>

        {displayProfile.tournamentResults.length > 0 && (
          <section className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-fairway-600">
              Tournament Results
            </h3>
            <p className="mt-1 text-[10px] text-fairway-400 print:hidden">
              {profileLocked
                ? 'Unlock profile to edit or delete results.'
                : 'Swipe left on a result to delete.'}
            </p>
            <div className="mt-4 space-y-3">
              {displayProfile.tournamentResults.map((result) => (
                <SwipeableTournamentResultRow
                  key={result.id}
                  result={result}
                  locked={profileLocked}
                  onDelete={handleDeleteTournamentResult}
                />
              ))}
            </div>
          </section>
        )}

        {stats ? (
          <>
            <section className="rounded-2xl bg-fairway-800 p-5 text-white shadow-lg">
              <div className="space-y-3">
                <ReportRow
                  label="Tournament Average"
                  value={formatScoringAverage(stats.avgScore)}
                  light
                />
                <ReportRow label="Fairway %" value={`${stats.fairwayPct}%`} light />
                <ReportRow label="GIR %" value={`${stats.girPct}%`} light />
                <ReportRow label="Average Putts" value={stats.avgPutts.toFixed(1)} light />
                <ReportRow
                  label="Birdies Per Round"
                  value={stats.birdiesPerRound.toFixed(1)}
                  light
                />
              </div>
            </section>

            {recentScores.length > 0 && (
              <section className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-fairway-800">
                  Last {Math.min(recentScores.length, 10)} Tournament Scores
                </h3>
                <div className="mt-4 space-y-2">
                  {recentScores.map((score, i) => (
                    <p
                      key={`${score}-${i}`}
                      className="border-b border-sand pb-2 text-2xl font-bold tabular-nums text-fairway-800 last:border-0 last:pb-0"
                    >
                      {score}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {(displayProfile.strength || displayProfile.developmentArea) && (
              <section className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
                <div className="space-y-3">
                  {displayProfile.strength && (
                    <ReportRow label="Strength" value={displayProfile.strength} />
                  )}
                  {displayProfile.developmentArea && (
                    <ReportRow label="Development Area" value={displayProfile.developmentArea} />
                  )}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand py-12 text-center">
            <p className="font-semibold text-fairway-700">No tournament rounds yet</p>
            <p className="mt-1 text-sm text-fairway-400">
              Complete tournament rounds to populate your recruiting report.
            </p>
          </div>
        )}

        <p className="text-center text-[10px] text-fairway-400">
          Generated by Lucas Golf Log ·{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 11V8a4 4 0 0 1 7.5-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReportPairRow({
  left,
  right,
}: {
  left: { label: string; value: string };
  right: { label: string; value: string };
}) {
  return (
    <div className="grid grid-cols-2 gap-4 border-b border-current/10 pb-3 last:border-0 last:pb-0">
      <ReportPairCell label={left.label} value={left.value} />
      <ReportPairCell label={right.label} value={right.value} />
    </div>
  );
}

function ReportPairCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium text-fairway-600">{label}:</span>
      <span className="text-right text-sm font-bold tabular-nums text-fairway-800">{value}</span>
    </div>
  );
}

function ReportRow({
  label,
  value,
  light,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-current/10 pb-3 last:border-0 last:pb-0">
      <span className={`text-sm font-medium ${light ? 'text-fairway-300' : 'text-fairway-600'}`}>
        {label}:
      </span>
      <span className={`text-right text-sm font-bold tabular-nums ${light ? 'text-white' : 'text-fairway-800'}`}>
        {value}
      </span>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-fairway-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
      {hint && <p className="mt-0.5 text-[10px] text-fairway-400">{hint}</p>}
    </div>
  );
}
