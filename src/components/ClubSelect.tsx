interface ClubSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}

export default function ClubSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select club',
  optional,
}: ClubSelectProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-fairway-800">
        {label}
        {optional && <span className="ml-1 font-normal text-fairway-400">(optional)</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-field text-base"
      >
        <option value="">{placeholder}</option>
        {options.map((club) => (
          <option key={club} value={club}>
            {club}
          </option>
        ))}
      </select>
    </div>
  );
}
