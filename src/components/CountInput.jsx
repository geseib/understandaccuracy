import { useEffect, useState } from 'react';

const MAX = 1000000;

export function clampCount(raw) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX);
}

// Number input that keeps its raw string locally so an emptied field
// doesn't snap back to 0 while the user is still typing.
export default function CountInput({ cellKey, value, onChange, label, style }) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (clampCount(text) !== value) setText(String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      className="cell-input"
      type="number"
      min="0"
      value={text}
      aria-label={label}
      style={style}
      onChange={(e) => {
        setText(e.target.value);
        onChange(cellKey, clampCount(e.target.value));
      }}
      onBlur={() => setText(String(value))}
    />
  );
}
