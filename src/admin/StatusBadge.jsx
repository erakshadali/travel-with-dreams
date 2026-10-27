import { statusLabel } from './format';

export default function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{statusLabel(status)}</span>;
}
