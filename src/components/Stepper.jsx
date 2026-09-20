import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function Stepper({ label, value, min = 1, max, onChange }) {
  const labelId = useId();

  return (
    <div className="stepper">
      <span id={labelId}>{label}</span>
      <div className="stepper__controls" role="group" aria-labelledby={labelId}>
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
          <Minus aria-hidden="true" />
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
