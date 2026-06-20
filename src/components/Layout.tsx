import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg overflow-x-hidden bg-cream">
      <main className="safe-top pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
