interface StarRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function StarRating({ label, value, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-white px-4 py-3 shadow-sm">
      <p className="shrink-0 text-sm font-semibold text-fairway-800">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            className="p-0.5 transition active:scale-90"
          >
            <svg
              className={`h-8 w-8 ${star <= value ? 'text-gold-500' : 'text-fairway-200'}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
