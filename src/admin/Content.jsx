import { Copy, ExternalLink, Pencil, Plus, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/client';
import { EmptyState, ErrorState } from '../components/States';
import { formatInr, keyOf } from './format';
import { useAdminData } from './useAdminData';

const TABS = [
  { id: 'trips', label: 'Trips' },
  { id: 'gems', label: 'Unexplored spots' },
  { id: 'testimonials', label: 'Reviews' },
];

const describe = {
  trips: (item) => `${item.location} · ${formatInr(item.price)} · ${item.days} days`,
  gems: (item) => `${item.region} · ${item.theme}`,
  testimonials: (item) => `${item.trip} · ${item.rating}/5 · ${item.from}`,
};

const titleOf = (collection, item) => (collection === 'trips' ? item.title : item.name);

const websiteLink = (collection, item) => (collection === 'trips' ? `/trips/${item.slug}` : collection === 'gems' ? '/unexplored' : '/');

export default function Content() {
  const [params, setParams] = useSearchParams();
  const collection = TABS.some((tab) => tab.id === params.get('c')) ? params.get('c') : 'trips';
  const tab = TABS.find((entry) => entry.id === collection);
  const { data, error, loading, reload } = useAdminData(() => adminApi.contentList(collection), `content-${collection}`);
  const items = data?.items ?? [];

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="eyebrow">Website content</p>
          <h1>Website content</h1>
          <p className="admin-muted">Change what visitors see on the website. Edits go live within a few seconds.</p>
        </div>
        <Link className="btn btn--cta btn--sm" to={`/admin/content/${collection}/new`}>
          <Plus aria-hidden="true" />
          Add {collection === 'trips' ? 'trip' : collection === 'gems' ? 'spot' : 'review'}
        </Link>
      </header>

      <div className="chips content-tabs" role="group" aria-label="Content type">
        {TABS.map((entry) => (
          <button key={entry.id} type="button" className={`chip${collection === entry.id ? ' is-active' : ''}`} aria-pressed={collection === entry.id} onClick={() => setParams({ c: entry.id }, { replace: true })}>
            {entry.label}
          </button>
        ))}
      </div>

      {loading && !data && <p className="admin-muted" role="status">Loading…</p>}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && items.length === 0 && (
        <EmptyState title={`No ${tab.label.toLowerCase()} yet`}>
          <p>Use the Add button to create the first one.</p>
        </EmptyState>
      )}

      {items.length > 0 && (
        <ul className="admin-card content-list">
          {items.map((item) => {
            const key = keyOf(collection, item);
            return (
              <li key={key}>
                <div className="content-list__main">
                  <p className="content-list__title">
                    {titleOf(collection, item)}
                    {item.published === false && <span className="badge badge--closed">Hidden</span>}
                    {item.featured && <Star aria-label="Featured on the home page" className="content-list__star" />}
                  </p>
                  <p className="admin-muted">{describe[collection](item)}</p>
                </div>
                <div className="content-list__actions">
                  <Link className="btn btn--outline btn--sm" to={`/admin/content/${collection}/${encodeURIComponent(key)}`}>
                    <Pencil aria-hidden="true" />
                    Edit
                  </Link>
                  {collection !== 'testimonials' && (
                    <Link className="btn btn--outline btn--sm" to={`/admin/content/${collection}/new?from=${encodeURIComponent(key)}`} title="Start a new one from this">
                      <Copy aria-hidden="true" />
                      Duplicate
                    </Link>
                  )}
                  {item.published !== false && (
                    <a className="btn btn--outline btn--sm" href={websiteLink(collection, item)} target="_blank" rel="noreferrer">
                      <ExternalLink aria-hidden="true" />
                      View
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
