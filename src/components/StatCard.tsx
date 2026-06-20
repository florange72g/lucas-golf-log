interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        accent
          ? 'bg-fairway-800 text-white'
          : 'border border-sand bg-white shadow-sm'
      }`}
    >
      <p className={`text-xs font-medium uppercase tracking-wide ${accent ? 'text-fairway-300' : 'text-fairway-500'}`}>
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-gold-400' : 'text-fairway-800'}`}>
        {value}
      </p>
      {sub && (
        <p className={`mt-0.5 text-xs ${accent ? 'text-fairway-200' : 'text-fairway-400'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
