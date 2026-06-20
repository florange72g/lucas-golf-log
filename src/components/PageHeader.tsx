import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backTo, action }: PageHeaderProps) {
  return (
    <header className="bg-fairway-800 px-5 pb-6 pt-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {backTo && (
            <Link
              to={backTo}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fairway-700 text-fairway-100 transition hover:bg-fairway-600"
              aria-label="Go back"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-fairway-200">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}
