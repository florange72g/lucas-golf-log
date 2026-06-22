import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useGolf } from '../context/GolfContext';

export default function Layout() {
  const location = useLocation();
  const { discardDraftRound } = useGolf();
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    const previous = pathnameRef.current;
    if (previous === '/new-round' && location.pathname !== '/new-round') {
      discardDraftRound();
    }
    pathnameRef.current = location.pathname;
  }, [location.pathname, discardDraftRound]);

  return (
    <div className="mx-auto min-h-dvh max-w-lg overflow-x-hidden bg-cream">
      <main className="safe-top pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
