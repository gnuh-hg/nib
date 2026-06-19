export const SWATCH_NAMES = [
  'teal',
  'blue',
  'green',
  'red',
  'purple',
  'rose',
  'orange',
  'slate',
] as const;

export type SwatchName = (typeof SWATCH_NAMES)[number];

interface SwatchPickerProps {
  value: string;
  onPick: (name: string) => void;
}

/** 8-color swatch row (design.md §8.2). Colors are data, via --swatch-* tokens. */
export function SwatchPicker({ value, onPick }: SwatchPickerProps) {
  return (
    <div className="nib-swatch-picker" role="listbox">
      {SWATCH_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          role="option"
          aria-selected={value === name}
          className="nib-swatch-btn"
          data-active={value === name}
          style={{ backgroundColor: `var(--swatch-${name})` }}
          onClick={() => onPick(value === name ? '' : name)}
          title={name}
        />
      ))}
    </div>
  );
}
