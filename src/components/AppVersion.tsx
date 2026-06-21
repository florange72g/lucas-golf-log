import { APP_VERSION } from '../config/version';

export default function AppVersion({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`.trim()}>
      <p className="text-[10px] text-fairway-400">Version {APP_VERSION}</p>
    </div>
  );
}
