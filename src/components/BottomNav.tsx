import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useGolf } from '../context/GolfContext';
import { hasStartedHoleEntry } from '../types';
import { isStatsUnlocked, promptStatsUnlock } from '../utils/profileLock';

const STATIC_NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/rounds', label: 'History', icon: HistoryIcon, end: false },
  { to: '/statistics', label: 'Stats', icon: ChartIcon, end: false },
  { to: '/recruiting', label: 'Profile', icon: DocIcon, end: false },
] as const;

const ROUND_PATHS = ['/new-round', '/hole-entry', '/round-summary/active', '/mental', '/coach', '/edit-round'];

export function getRoundNavPath(activeRound: ReturnType<typeof useGolf>['activeRound']): string {
  if (activeRound && hasStartedHoleEntry(activeRound)) return '/hole-entry';
  return '/new-round';
}

export default function BottomNav() {
  const { activeRound } = useGolf();
  const location = useLocation();
  const roundTo = getRoundNavPath(activeRound);
  const isRoundActive = ROUND_PATHS.some(
    (path) =>
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`),
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom" aria-label="Main navigation">
      <div className="mx-auto max-w-lg px-3 pb-3">
        <div className="flex items-center justify-around rounded-2xl bg-fairway-800 px-1 py-2 shadow-lg shadow-fairway-900/20">
          <NavLink
            to="/"
            end
            className={({ isActive }) => navClass(isActive)}
          >
            <HomeIcon />
            <span>Home</span>
          </NavLink>

          <NavLink to={roundTo} className={() => navClass(isRoundActive)}>
            <FlagIcon />
            <span>Round</span>
          </NavLink>

          {STATIC_NAV.slice(1).map(({ to, label, icon: Icon, end }) =>
            to === '/statistics' ? (
              <StatsNavButton
                key={to}
                isActive={location.pathname === '/statistics'}
              />
            ) : (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => navClass(isActive)}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ),
          )}
        </div>
      </div>
    </nav>
  );
}

function navClass(isActive: boolean): string {
  return `flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 text-[10px] font-medium transition-colors ${
    isActive ? 'bg-fairway-700 text-gold-400' : 'text-fairway-200 hover:text-white'
  }`;
}

function StatsNavButton({ isActive }: { isActive: boolean }) {
  const navigate = useNavigate();
  const locked = !isStatsUnlocked() && !isActive;

  const handleClick = () => {
    if (isActive) return;
    if (isStatsUnlocked() || promptStatsUnlock()) {
      navigate('/statistics');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={locked ? 'Unlock Stats' : 'Stats'}
      className={navClass(isActive)}
    >
      <ChartIcon />
      <span className="flex items-center gap-0.5">
        {locked && <LockIcon />}
        Stats
      </span>
    </button>
  );
}

function LockIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
