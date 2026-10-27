import { History, StickyNote, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/client';
import { EmptyState, ErrorState } from '../components/States';
import { formatDateTime, statusLabel } from './format';
import { useAdminData } from './useAdminData';

function describe({ action, detail }) {
  if (action === 'status_changed') {
    return { icon: Tag, text: `${detail.name}'s ${detail.kind} moved from ${statusLabel(detail.from)} to ${statusLabel(detail.to)}` };
  }
  if (action === 'note_updated') return { icon: StickyNote, text: `Note updated on ${detail.name}'s ${detail.kind}` };
  return { icon: History, text: action };
}

export default function Activity() {
  const { data, error, loading, reload } = useAdminData(() => adminApi.activity(), 'activity');

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="eyebrow">Activity log</p>
          <h1>Activity log</h1>
          <p className="admin-muted">Every status change and note, newest first.</p>
        </div>
      </header>

      {loading && !data && <p className="admin-muted" role="status">Loading…</p>}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No activity yet">
          <p>When you change a status or add a note, it is recorded here.</p>
        </EmptyState>
      )}

      {data && data.items.length > 0 && (
        <ul className="admin-card timeline">
          {data.items.map((entry) => {
            const { icon: Icon, text } = describe(entry);
            return (
              <li key={`${entry.createdAt}-${entry.action}-${entry.reference}`}>
                <span className="timeline__icon"><Icon aria-hidden="true" /></span>
                <div>
                  <p>{text}</p>
                  <p className="admin-muted">
                    <Link to={`/admin/${entry.detail.kind}s?ref=${entry.reference}`}>{entry.reference}</Link> ·{' '}
                    <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
