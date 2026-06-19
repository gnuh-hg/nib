import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface RenameFieldProps {
  initial: string;
  onCommit: (title: string) => void;
}

/** Inline rename input — autofocuses, commits on Enter/blur, cancels on Escape. */
export function RenameField({ initial, onCommit }: RenameFieldProps) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') onCommit(value);
    else if (e.key === 'Escape') onCommit(initial);
  };

  return (
    <input
      ref={ref}
      className="nib-lib-rename"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => onCommit(value)}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
